from uuid import UUID

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import get_current_user_id
from app.database.connection import get_db
from app.models.chatbot import Chatbot
from app.schemas.chatbot import (
    ChatbotCreate,
    ChatbotResponse,
    ChatbotUpdate,
)


router = APIRouter(
    prefix="/chatbots",
    tags=["Chatbots"],
)


@router.post(
    "",
    response_model=ChatbotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_chatbot(
    data: ChatbotCreate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # The JWT tells us which user owns this chatbot.
    owner_id = UUID(user_id)

    chatbot = Chatbot(
        owner_id=owner_id,
        name=data.name,
        description=data.description,
        system_prompt=data.system_prompt,
        welcome_message=data.welcome_message,
    )

    db.add(chatbot)
    db.commit()
    db.refresh(chatbot)

    return chatbot


@router.get(
    "",
    response_model=list[ChatbotResponse],
)
def get_chatbots(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Only show chatbots created by the logged-in user.
    owner_id = UUID(user_id)

    return (
        db.query(Chatbot)
        .filter(Chatbot.owner_id == owner_id)
        .order_by(Chatbot.created_at.desc())
        .all()
    )


@router.get(
    "/{chatbot_id}",
    response_model=ChatbotResponse,
)
def get_chatbot(
    chatbot_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Prevent users from opening another user's chatbot.
    owner_id = UUID(user_id)

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

    return chatbot


@router.put(
    "/{chatbot_id}",
    response_model=ChatbotResponse,
)
def update_chatbot(
    chatbot_id: UUID,
    data: ChatbotUpdate,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Only the chatbot owner can change its settings.
    owner_id = UUID(user_id)

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

    # Only update fields that were actually provided.
    update_data = data.model_dump(exclude_unset=True)

    for field, value in update_data.items():
        setattr(chatbot, field, value)

    db.commit()
    db.refresh(chatbot)

    return chatbot


@router.delete(
    "/{chatbot_id}",
)
def delete_chatbot(
    chatbot_id: UUID,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Only the chatbot owner can delete it.
    owner_id = UUID(user_id)

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

    db.delete(chatbot)
    db.commit()

    return {
        "message": "Chatbot deleted successfully",
    }