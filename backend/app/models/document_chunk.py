import uuid
from datetime import datetime, timezone

from sqlalchemy import DateTime, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database.base import Base


class DocumentChunk(Base):
    __tablename__ = "document_chunks"

    # Give every chunk its own unique ID.
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        primary_key=True,
        default=uuid.uuid4,
    )

    # Connect this chunk to the original uploaded document.
    document_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True),
        ForeignKey("documents.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )

    # Keep the original order of chunks from the document.
    chunk_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # Store the actual text that will later be embedded and searched.
    content: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # Record when this chunk was created.
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=False,
        default=lambda: datetime.now(timezone.utc),
    )

    # Allow access from a chunk to its parent document.
    document = relationship(
        "Document",
        backref="chunks",
    )