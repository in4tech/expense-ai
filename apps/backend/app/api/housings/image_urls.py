"""Helpers to keep housings.image_urls as a PostgreSQL text[] (list[str])."""

from __future__ import annotations

from uuid import UUID

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models.housing import Housing
from app.db.models.housing_images import HousingImages


def normalize_image_urls(value: object | None) -> list[str]:
    if value is None:
        return []
    if isinstance(value, list):
        return [u.strip() for u in value if isinstance(u, str) and u.strip()]
    if isinstance(value, tuple):
        return [u.strip() for u in value if isinstance(u, str) and u.strip()]
    if isinstance(value, str):
        raw = value.strip()
        if not raw:
            return []
        if raw.startswith("{") and raw.endswith("}"):
            raw = raw[1:-1].strip()
        if not raw:
            return []
        urls: list[str] = []
        for part in raw.split(","):
            url = part.strip().strip('"').strip("'")
            if url:
                urls.append(url)
        return urls
    return []


async def sync_housing_image_urls(
    db: AsyncSession,
    housing_id: UUID,
    housing: Housing,
) -> list[str]:
    result = await db.execute(
        select(HousingImages.image_url)
        .where(HousingImages.housing_id == housing_id)
        .order_by(HousingImages.is_thumbnail.desc(), HousingImages.created_at.asc())
    )
    urls = [row[0] for row in result.all() if row[0]]
    housing.image_urls = urls or None
    return urls
