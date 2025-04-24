from uuid import UUID

from pydantic import BaseModel, Field


class ChatRequest(BaseModel):
    # The message sent by the customer.
    message: str = Field(
        min_length=1,
        max_length=5000,
    )

    # Optional conversation ID for continuing an existing conversation.
    conversation_id: UUID | None = None


class ChatResponse(BaseModel):
    # Conversation used for this chat request.
    conversation_id: UUID

    # The AI-generated answer.
    answer: str