from uuid import UUID

from fastapi import APIRouter, HTTPException, Query
from sqlalchemy import select
from sqlalchemy.orm import selectinload

from app.db.models.housing import Housing
from app.db.models.room import Room
from app.db.session import DbSession

router = APIRouter()


def _housing_row(housing: Housing) -> dict:
    return {
        "id": str(housing.id),
        "electricity_unit": housing.electricity_unit,
        "water_unit": housing.water_unit,
        "otherfee": housing.otherfee,
        "parking_unit": housing.parking_unit,
        "room_code": housing.room_code,
        "room_id": str(housing.room_id) if housing.room_id else None,
        "price": housing.price,
        "house_name": housing.house_name,
        "is_allow_electric_car": housing.is_allow_electric_car,
        "electricity_fee": housing.electricity_fee,
        "water_fee": housing.water_fee,
        "card_fee": housing.card_fee,
        "washing_machine_fee": housing.washing_machine_fee,
        "parking_fee": housing.parking_fee,
        "garbage_fee": housing.garbage_fee,
        "card_unit": housing.card_unit,
        "garbage_unit": housing.garbage_unit,
        "has_wifi": housing.has_wifi,
        "address": housing.address,
        "latitude": housing.latitude,
        "longitude": housing.longitude,
        "amenities": housing.amenities,
        "last_update": housing.last_update.isoformat() if housing.last_update else None,
        "created_at": housing.created_at.isoformat() if housing.created_at else None,
        "updated_at": housing.updated_at.isoformat() if housing.updated_at else None,
    }


def _room_row(room: Room) -> dict:
    return {
        "id": str(room.id),
        "kitchen": room.kitchen,
        "desk": room.desk,
        "bed": room.bed,
        "elevator": room.elevator,
        "tivi": room.tivi,
        "mattress": room.mattress,
        "cooling_type": room.cooling_type,
        "pet": room.pet,
        "parking_space": room.parking_space,
        "toilet": room.toilet,
        "time": room.time,
        "gatelock": room.gatelock,
        "room_area": room.room_area,
        "bancony": room.bancony,
        "fridge": room.fridge,
        "washer": room.washer,
        "hotwater": room.hotwater,
        "air_conditioner": room.air_conditioner,
        "kitchent_sink": room.kitchent_sink,
        "window": room.window,
        "drying_yard": room.drying_yard,
        "wardrobe": room.wardrobe,
        "floor": room.floor,
        "skylight": room.skylight,
        "attic": room.attic,
        "created_at": room.created_at.isoformat() if room.created_at else None,
        "updated_at": room.updated_at.isoformat() if room.updated_at else None,
    }


@router.get("/{housing_id}")
async def get_housing_detail(housing_id: UUID, db: DbSession):
    result = await db.execute(
        select(Housing)
        .where(Housing.id == housing_id)
        .options(selectinload(Housing.room))
    )
    housing = result.scalar_one_or_none()
    if housing is None:
        raise HTTPException(status_code=404, detail="Housing not found")
    return {
        "housing": _housing_row(housing),
        "room": _room_row(housing.room) if housing.room else None,
    }


@router.get("")
async def get_housings(
    db: DbSession,
    limit: int = Query(default=100, ge=1, le=500),
    offset: int = Query(default=0, ge=0),
):
    rows = await db.execute(
        select(Housing)
        .order_by(Housing.created_at.desc(), Housing.id.desc())
        .limit(limit)
        .offset(offset)
    )
    housings = rows.scalars().all()

    return {
        "housings": [_housing_row(housing) for housing in housings],
        "limit": limit,
        "offset": offset,
    }
