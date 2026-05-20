import uuid
from uuid import UUID

from sqlalchemy import Column, ForeignKey
from sqlalchemy.types import Uuid


def uuid_pk():
    return Column(Uuid(as_uuid=True), primary_key=True, default=uuid.uuid4)


def uuid_fk(table: str, *, nullable: bool = False, index: bool = False):
    return Column(
        Uuid(as_uuid=True),
        ForeignKey(f"{table}.id"),
        nullable=nullable,
        index=index,
    )


def as_uuid(value: str | UUID) -> UUID:
    if isinstance(value, UUID):
        return value
    return UUID(str(value))
