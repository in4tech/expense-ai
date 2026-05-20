import uuid
from typing import Annotated
from uuid import UUID

from fastapi import Depends, HTTPException
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import decode_token
from app.db.models.user import User
from app.db.session import DbSession

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/auth/login")


def user_id_from_token_payload(payload: dict) -> UUID:
    sub = payload.get("sub")
    if sub is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    try:
        return uuid.UUID(str(sub))
    except (TypeError, ValueError, AttributeError):
        raise HTTPException(status_code=401, detail="Invalid token")


async def get_user_by_email(
    db: AsyncSession,
    email: str,
):
    result = await db.execute(
        select(User)
        .where(User.email == email)
    )

    return result.scalar_one_or_none()


async def get_current_user(
    token: Annotated[str, Depends(oauth2_scheme)],
    db: DbSession,
) -> User:
    try:
        payload = decode_token(token)
        user_id = user_id_from_token_payload(payload)

        result = await db.execute(
            select(User)
            .where(User.id == user_id)
        )

        user = result.scalar_one_or_none()
        if not user:
            raise HTTPException(
                status_code=401,
                detail="User not found",
            )

        return user

    except HTTPException:
        raise
    except Exception:
        raise HTTPException(
            status_code=401,
            detail="Invalid token",
        )


CurrentUser = Annotated[User, Depends(get_current_user)]
