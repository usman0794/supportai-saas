"""
Chatbot database model.

Each chatbot belongs to a SupportAI user and contains
the configuration required to power an AI support assistant.
"""

import uuid
from datetime import datetime, timezone

from sqlalchemy import Boolean, ForeignKey, String, Text, DateTime
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Chatbot(Base):
    """
    Represents an AI chatbot created by a user.
    """

    __tablename__ = "chatbots"

    # Unique identifier for the chatbot.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # The user who owns this chatbot.
    owner_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("profiles.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Display name of the chatbot.
    name: Mapped[str] = mapped_column(
        String(100),
        nullable=False,
    )

    # Optional description of the chatbot.
    description: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # Instructions that define how the AI should behave.
    system_prompt: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default=(
            "You are a helpful customer support assistant. "
            "Answer questions accurately and professionally."
        ),
    )

    # Message shown when a user opens the chatbot.
    welcome_message: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        default="Hi! How can I help you today?",
    )

    # Primary color used by the embeddable chatbot widget.
    primary_color: Mapped[str] = mapped_column(
        String(7),
        nullable=False,
        default="#111827",
    )

    # Whether the chatbot is currently active.
    is_active: Mapped[bool] = mapped_column(
        Boolean,
        nullable=False,
        default=True,
    )

    # Timestamp when the chatbot was created.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Timestamp when the chatbot was last updated.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationship to the profile/user who owns this chatbot.
    owner = relationship(
        "Profile",
        backref="chatbots",
    )