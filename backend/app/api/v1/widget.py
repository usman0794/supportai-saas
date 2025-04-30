from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.connection import get_db

from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.models.message import Message

from app.schemas.chat import ChatRequest, ChatResponse

from app.services.ai import generate_ai_answer


router = APIRouter(
    prefix="/widget",
    tags=["Widget"],
)


@router.get("/{chatbot_id}/config")
def get_widget_config(
    chatbot_id: UUID,
    db: Session = Depends(get_db),
):
    """
    Public configuration endpoint used by the embeddable widget.

    Returns only safe chatbot information needed by the
    customer's website.
    """

    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.is_active == True,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found or inactive",
        )

    return {
        "id": str(chatbot.id),
        "name": chatbot.name,
        "description": chatbot.description,
        "welcome_message": chatbot.welcome_message,
        "primary_color": chatbot.primary_color,
    }


@router.post(
    "/{chatbot_id}/chat",
    response_model=ChatResponse,
)
def widget_chat(
    chatbot_id: UUID,
    data: ChatRequest,
    db: Session = Depends(get_db),
):
    """
    Public chat endpoint used by the embeddable SupportAI widget.

    Unlike the normal chat endpoint, this endpoint does not require
    a logged-in SupportAI user.
    """

    # Only active chatbots can receive widget messages.
    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.is_active == True,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found or inactive",
        )

    # Continue an existing anonymous conversation.
    conversation = None

    if data.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == data.conversation_id,
                Conversation.chatbot_id == chatbot_id,
                Conversation.user_id.is_(None),
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Widget conversation not found",
            )

    # Create a new guest conversation.
    if not conversation:
        conversation = Conversation(
            chatbot_id=chatbot_id,
            user_id=None,
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save the visitor's message.
    user_message = Message(
        conversation_id=conversation.id,
        role="user",
        content=data.message,
    )

    db.add(user_message)

    # Explicitly update the conversation timestamp.
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()

    try:
        # Use the same AI orchestration layer as the normal chatbot.
        # This supports both RAG and Tool Calling.
        answer = generate_ai_answer(
            question=data.message,
            chatbot_id=str(chatbot_id),
        )

    except Exception as error:
        print("\n========== WIDGET AI ERROR ==========")
        print(type(error).__name__)
        print(str(error))
        print("=====================================\n")

        raise HTTPException(
            status_code=500,
            detail=f"AI response failed: {str(error)}",
        )

    # Save the AI response.
    assistant_message = Message(
        conversation_id=conversation.id,
        role="assistant",
        content=answer,
    )

    db.add(assistant_message)

    # Update the conversation timestamp again so it
    # represents the latest message/activity.
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        answer=answer,
    )