import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class Conversation(Base):
    __tablename__ = "conversations"

    # Give every conversation a unique ID.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Connect the conversation to the chatbot.
    chatbot_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "chatbots.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Keep the user ID nullable for future guest conversations.
    user_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "profiles.id",
            ondelete="SET NULL",
        ),
        nullable=True,
        index=True,
    )

    # Record when the conversation was created.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Update whenever the conversation receives a new message.
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Connect the conversation to its chatbot and user.
    chatbot = relationship(
        "Chatbot",
        backref="conversations",
    )

    user = relationship(
        "Profile",
        backref="conversations",
    )