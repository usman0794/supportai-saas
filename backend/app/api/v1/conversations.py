from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db
from app.models.chatbot import Chatbot
from app.models.conversation import Conversation
from app.models.message import Message
from app.schemas.conversation import (
    ConversationResponse,
    MessageResponse,
)


router = APIRouter(
    prefix="/conversations",
    tags=["Conversations"],
)


@router.get(
    "",
    response_model=list[ConversationResponse],
)
def get_conversations(
    chatbot_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Return all conversations for a chatbot owned by
    the currently authenticated user.

    This includes:
    - authenticated conversations
    - guest/widget conversations where user_id is NULL
    """

    owner_id = UUID(user_id)

    # First verify that the chatbot belongs to the
    # authenticated user.
    chatbot = (
        db.query(Chatbot)
        .filter(
            Chatbot.id == chatbot_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not chatbot:
        raise HTTPException(
            status_code=404,
            detail="Chatbot not found",
        )

    # Once ownership of the chatbot is verified,
    # the owner can see all conversations belonging
    # to that chatbot, including widget/guest chats.
    return (
        db.query(Conversation)
        .filter(
            Conversation.chatbot_id == chatbot_id,
        )
        .order_by(
            Conversation.updated_at.desc()
        )
        .all()
    )


@router.get(
    "/{conversation_id}",
    response_model=ConversationResponse,
)
def get_conversation(
    conversation_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Return a single conversation.

    The chatbot must belong to the authenticated user.
    """

    owner_id = UUID(user_id)

    conversation = (
        db.query(Conversation)
        .join(
            Chatbot,
            Chatbot.id == Conversation.chatbot_id,
        )
        .filter(
            Conversation.id == conversation_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return conversation


@router.get(
    "/{conversation_id}/messages",
    response_model=list[MessageResponse],
)
def get_messages(
    conversation_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Return all messages for a conversation.

    Access is allowed only when the conversation's
    chatbot belongs to the authenticated user.
    """

    owner_id = UUID(user_id)

    conversation = (
        db.query(Conversation)
        .join(
            Chatbot,
            Chatbot.id == Conversation.chatbot_id,
        )
        .filter(
            Conversation.id == conversation_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    return (
        db.query(Message)
        .filter(
            Message.conversation_id == conversation_id
        )
        .order_by(
            Message.created_at.asc()
        )
        .all()
    )


@router.delete(
    "/{conversation_id}",
)
def delete_conversation(
    conversation_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    """
    Delete a conversation.

    The authenticated user must own the chatbot
    associated with the conversation.
    """

    owner_id = UUID(user_id)

    conversation = (
        db.query(Conversation)
        .join(
            Chatbot,
            Chatbot.id == Conversation.chatbot_id,
        )
        .filter(
            Conversation.id == conversation_id,
            Chatbot.owner_id == owner_id,
        )
        .first()
    )

    if not conversation:
        raise HTTPException(
            status_code=404,
            detail="Conversation not found",
        )

    try:
        # Messages are removed through the existing
        # database ON DELETE CASCADE relationship.
        db.delete(conversation)
        db.commit()

        return {
            "message": "Conversation deleted successfully",
        }

    except Exception as error:
        db.rollback()

        print(
            "Conversation deletion error:",
            str(error),
        )

        raise HTTPException(
            status_code=500,
            detail="Failed to delete conversation",
        )