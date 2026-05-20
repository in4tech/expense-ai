from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, EmailStr

from app.db.session import DbSession
from app.services.auth_service import (
    CurrentUser,
    get_user_by_email,
    user_id_from_token_payload,
)
from app.core.security import create_access_token, create_refresh_token, decode_token, hash_password, verify_password
from app.core.redis import redis_client
from app.db.models.user import User


router = APIRouter()

class AuthSchema(BaseModel):
    email: EmailStr
    password: str

class RefreshSchema(BaseModel):
    refresh_token: str

@router.post("/register")
async def register(
    payload: AuthSchema,
    db: DbSession
):
    existing_user = await get_user_by_email(
        db,
        payload.email
    )

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email already exists"
        )

    user = User(
        email=payload.email,
        password_hash=hash_password(
            payload.password
        )
    )

    db.add(user)

    await db.commit()

    return {
        "message": "Register success"
    }


@router.post("/login")
async def login(
    db: DbSession,
    payload: AuthSchema
):
    user = await get_user_by_email(
        db,
        payload.email
    )

    if not user:
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    if not verify_password(
        payload.password,
        user.password_hash
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid credentials"
        )

    access_token = create_access_token({"sub": str(user.id)})
    refresh_token = create_refresh_token({"sub": str(user.id)})

    await redis_client.set(
        f"refresh:{user.id}",
        refresh_token,
        ex=60 * 60 * 24 * 30
    )

    return {
        "access_token": access_token,
        "refresh_token": refresh_token
    }

@router.post("/refresh")
async def refresh(
    payload: RefreshSchema
):
    try:
        token_data = decode_token(payload.refresh_token)
        user_id = user_id_from_token_payload(token_data)
        stored_token = await redis_client.get(
            f"refresh:{user_id}"
        )

        if stored_token != payload.refresh_token:
            raise HTTPException(
                status_code=401,
                detail="Invalid refresh token"
            )

        access_token = create_access_token({
            "sub": str(user_id),
        })

        return {
            "access_token": access_token
        }

    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid refresh token"
        )

@router.post("/logout")
async def logout(current_user: CurrentUser):
    await redis_client.delete(
        f"refresh:{current_user.id}"
    )

    return {
        "message": "Logged out"
    }


@router.get("/me")
async def me(current_user: CurrentUser):
    return {
        "id": str(current_user.id),
        "email": current_user.email
    }