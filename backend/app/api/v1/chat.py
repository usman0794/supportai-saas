from datetime import datetime, timezone
from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db

from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.models.message import Message

from app.schemas.chat import ChatRequest, ChatResponse

from app.services.ai import generate_ai_answer


router = APIRouter(
    prefix="/chat",
    tags=["Chat"],
)


@router.post(
    "/{chatbot_id}",
    response_model=ChatResponse,
)
def chat(
    chatbot_id: UUID,
    data: ChatRequest,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Make sure the chatbot belongs to the logged-in user.
    owner_id = UUID(user_id)

    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.owner_id == owner_id,
            Chatbot.is_active == True,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found or inactive",
        )

    # Continue an existing conversation when its ID is provided.
    conversation = None

    if data.conversation_id:
        conversation = (
            db.query(Conversation)
            .filter(
                Conversation.id == data.conversation_id,
                Conversation.chatbot_id == chatbot_id,
                Conversation.user_id == owner_id,
            )
            .first()
        )

        if not conversation:
            raise HTTPException(
                status_code=404,
                detail="Conversation not found",
            )

    # Otherwise, create a new conversation.
    if not conversation:
        conversation = Conversation(
            chatbot_id=chatbot_id,
            user_id=owner_id,
        )

        db.add(conversation)
        db.commit()
        db.refresh(conversation)

    # Save the customer's message.
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
        # Search the knowledge base and generate the answer.
        answer = generate_ai_answer(
            question=data.message,
            chatbot_id=str(chatbot_id),
        )

    except Exception as error:
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
    # reflects the latest activity.
    conversation.updated_at = datetime.now(timezone.utc)

    db.commit()

    return ChatResponse(
        conversation_id=conversation.id,
        answer=answer,
    )