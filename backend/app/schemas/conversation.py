from datetime import datetime
from uuid import UUID

from pydantic import BaseModel


class ConversationResponse(BaseModel):
    id: UUID
    chatbot_id: UUID
    user_id: UUID | None
    created_at: datetime
    updated_at: datetime

    # Let Pydantic read data directly from SQLAlchemy models.
    model_config = {"from_attributes": True}


class MessageResponse(BaseModel):
    id: UUID
    conversation_id: UUID
    role: str
    content: str
    created_at: datetime

    # Return SQLAlchemy message objects directly.
    model_config = {"from_attributes": True}