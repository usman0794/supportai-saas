import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship, backref

from app.database.base import Base


class Message(Base):
    __tablename__ = "messages"

    # Give every message a unique ID.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Delete messages automatically when their conversation is deleted.
    conversation_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey(
            "conversations.id",
            ondelete="CASCADE",
        ),
        nullable=False,
        index=True,
    )

    # Identify who created the message.
    role: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
    )

    # Store the actual message text.
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Record when the message was created.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Let PostgreSQL handle child-message deletion through ON DELETE CASCADE.
    conversation = relationship(
        "Conversation",
        backref=backref(
            "messages",
            passive_deletes=True,
        ),
    )