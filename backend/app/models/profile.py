import uuid

from sqlalchemy import String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.database.base import Base


class Profile(Base):
    """
    Represents a user profile in the SupportAI application.
    """

    __tablename__ = "profiles"

    # Unique identifier for the user.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # User's email address.
    email: Mapped[str] = mapped_column(
        String(255),
        unique=True,
        nullable=False,
        index=True,
    )

    # User's hashed password.
    # We NEVER store the user's actual password.
    password_hash: Mapped[str] = mapped_column(
        String(255),
        nullable=False,
    )

    # User's display name.
    full_name: Mapped[str | None] = mapped_column(
        String(100),
        nullable=True,
    )

    # Optional profile picture URL.
    avatar_url: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )