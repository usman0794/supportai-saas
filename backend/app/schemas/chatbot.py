"""
Pydantic schemas for chatbot operations.

These schemas define the data accepted by the chatbot API
and the data returned to the frontend.
"""

from datetime import datetime
from uuid import UUID

from pydantic import BaseModel, Field


class ChatbotCreate(BaseModel):
    """
    Data required to create a chatbot.
    """

    name: str = Field(
        min_length=1,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    system_prompt: str = Field(
        default=(
            "You are a helpful customer support assistant. "
            "Answer questions accurately and professionally."
        ),
    )

    welcome_message: str = Field(
        default="Hi! How can I help you today?",
    )


class ChatbotUpdate(BaseModel):
    """
    Data that can be updated for an existing chatbot.
    """

    name: str | None = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    description: str | None = Field(
        default=None,
        max_length=1000,
    )

    system_prompt: str | None = None

    welcome_message: str | None = None

    is_active: bool | None = None


class ChatbotResponse(BaseModel):
    """
    Chatbot data returned by the API.
    """

    id: UUID
    owner_id: UUID
    name: str
    description: str | None
    system_prompt: str
    welcome_message: str
    is_active: bool
    created_at: datetime
    updated_at: datetime

    model_config = {
        "from_attributes": True
    }