"""Import rooms and housings from CSV into PostgreSQL."""

from __future__ import annotations

import asyncio
from datetime import datetime
from pathlib import Path
from uuid import UUID

import pandas as pd
from sqlalchemy import delete

from app.db.base import Base
from app.db.models.housing import Housing
from app.db.models.room import Room
from app.db.schema_patch import ensure_pgvector_extension
from app.db.session import SessionLocal, engine

DATA_DIR = Path(__file__).resolve().parent
ROOMS_CSV = DATA_DIR / "rooms.csv"
HOUSINGS_CSV = DATA_DIR / "housings.csv"
COORDS_CSV = DATA_DIR / "housing_with_coordinates.csv"


def _is_missing(value) -> bool:
    return value is None or (isinstance(value, float) and pd.isna(value)) or pd.isna(value)


def parse_bool(value) -> bool | None:
    if _is_missing(value):
        return None
    if isinstance(value, bool):
        return value
    normalized = str(value).strip().lower()
    if normalized in {"true", "t", "1"}:
        return True
    if normalized in {"false", "f", "0"}:
        return False
    return None


def parse_uuid(value) -> UUID | None:
    if _is_missing(value) or str(value).strip() == "":
        return None
    return UUID(str(value))


def parse_int(value) -> int | None:
    if _is_missing(value):
        return None
    return int(value)


def parse_float(value) -> float | None:
    if _is_missing(value):
        return None
    return float(value)


def parse_dt(value) -> datetime | None:
    if _is_missing(value):
        return None
    return pd.to_datetime(value).to_pydatetime()


def parse_amenities(value) -> dict | None:
    if _is_missing(value):
        return None
    return {"text": str(value)}


def room_from_row(row: pd.Series) -> Room:
    return Room(
        id=parse_uuid(row["id"]),
        kitchen=parse_bool(row["kitchen"]),
        desk=parse_bool(row["desk"]),
        bed=parse_bool(row["bed"]),
        elevator=parse_bool(row["elevator"]),
        tivi=parse_bool(row["tivi"]),
        mattress=parse_bool(row["mattress"]),
        cooling_type=None if _is_missing(row["cooling_type"]) else str(row["cooling_type"]),
        pet=parse_bool(row["pet"]),
        parking_space=None if _is_missing(row["parking_space"]) else str(row["parking_space"]),
        toilet=None if _is_missing(row["toilet"]) else str(row["toilet"]),
        time=None if _is_missing(row["time"]) else str(row["time"]),
        gatelock=None if _is_missing(row["gatelock"]) else str(row["gatelock"]),
        room_area=None if _is_missing(row["room_area"]) else str(row["room_area"]),
        bancony=parse_bool(row["bancony"]),
        fridge=parse_bool(row["fridge"]),
        washer=parse_bool(row["washer"]),
        hotwater=parse_bool(row["hotwater"]),
        air_conditioner=parse_bool(row["air_conditioner"]),
        kitchent_sink=parse_bool(row["kitchent_sink"]),
        window=parse_bool(row["window"]),
        drying_yard=None if _is_missing(row["drying_yard"]) else str(row["drying_yard"]),
        wardrobe=parse_bool(row["wardrobe"]),
        floor=None if _is_missing(row["floor"]) else str(row["floor"]),
        skylight=parse_bool(row["skylight"]),
        attic=parse_bool(row["attic"]),
        created_at=parse_dt(row["created_at"]),
        updated_at=parse_dt(row["updated_at"]),
    )


def housing_from_row(row: pd.Series) -> Housing:
    return Housing(
        id=parse_uuid(row["id"]),
        electricity_unit=None if _is_missing(row["electricity_unit"]) else str(row["electricity_unit"]),
        water_unit=None if _is_missing(row["water_unit"]) else str(row["water_unit"]),
        otherfee=parse_int(row["otherfee"]),
        parking_unit=None if _is_missing(row["parking_unit"]) else str(row["parking_unit"]),
        room_code=None if _is_missing(row["room_code"]) else str(row["room_code"]),
        room_id=parse_uuid(row["room_id"]),
        price=parse_int(row["price"]),
        house_name=None if _is_missing(row["house_name"]) else str(row["house_name"]),
        is_allow_electric_car=None
        if _is_missing(row["is_allow_electric_car"])
        else str(row["is_allow_electric_car"]),
        electricity_fee=parse_int(row["electricity_fee"]),
        water_fee=parse_int(row["water_fee"]),
        card_fee=parse_int(row["card_fee"]),
        washing_machine_fee=parse_int(row["washing_machine_fee"]),
        parking_fee=parse_int(row["parking_fee"]),
        garbage_fee=parse_int(row["garbage_fee"]),
        card_unit=None if _is_missing(row["card_unit"]) else str(row["card_unit"]),
        garbage_unit=None if _is_missing(row["garbage_unit"]) else str(row["garbage_unit"]),
        has_wifi=parse_bool(row["has_wifi"]),
        address=None if _is_missing(row["address"]) else str(row["address"]),
        latitude=parse_float(row["latitude"]) if "latitude" in row else None,
        longitude=parse_float(row["longitude"]) if "longitude" in row else None,
        amenities=parse_amenities(row["amenities"]),
        last_update=parse_dt(row["last_update"]),
        created_at=parse_dt(row["created_at"]),
        updated_at=parse_dt(row["updated_at"]),
    )


async def seed_housings_and_rooms() -> tuple[int, int]:
    if not ROOMS_CSV.exists():
        raise FileNotFoundError(f"Missing rooms CSV: {ROOMS_CSV}")
    if not HOUSINGS_CSV.exists():
        raise FileNotFoundError(f"Missing housings CSV: {HOUSINGS_CSV}")

    async with engine.begin() as conn:
        await ensure_pgvector_extension(conn)
        await conn.run_sync(Base.metadata.create_all)

    rooms_df = pd.read_csv(ROOMS_CSV)
    housings_df = pd.read_csv(HOUSINGS_CSV)

    if COORDS_CSV.exists():
        coords_df = pd.read_csv(COORDS_CSV)[["id", "latitude", "longitude"]]
        housings_df = housings_df.drop(columns=["latitude", "longitude"], errors="ignore")
        housings_df = housings_df.merge(coords_df, on="id", how="left")

    async with SessionLocal() as session:
        await session.execute(delete(Housing))
        await session.execute(delete(Room))
        await session.flush()

        for _, row in rooms_df.iterrows():
            session.add(room_from_row(row))

        for _, row in housings_df.iterrows():
            session.add(housing_from_row(row))

        await session.commit()

    return len(rooms_df), len(housings_df)


async def main() -> None:
    room_count, housing_count = await seed_housings_and_rooms()
    print(f"Imported {room_count} rooms and {housing_count} housings.")


if __name__ == "__main__":
    asyncio.run(main())
