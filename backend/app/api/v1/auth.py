from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.security import (
    create_access_token,
    get_current_user_id,
    hash_password,
    verify_password,
)
from app.database.connection import get_db
from app.models.profile import Profile
from app.schemas.auth import (
    LoginRequest,
    RegisterRequest,
    TokenResponse,
    UserResponse,
)

router = APIRouter(
    prefix="/auth",
    tags=["Authentication"],
)


@router.post(
    "/register",
    response_model=UserResponse,
    status_code=status.HTTP_201_CREATED,
)
def register_user(
    data: RegisterRequest,
    db: Session = Depends(get_db),
):
    existing_user = (
        db.query(Profile)
        .filter(Profile.email == data.email)
        .first()
    )

    if existing_user:
        raise HTTPException(
            status_code=409,
            detail="Email is already registered",
        )

    user = Profile(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
    )

    db.add(user)
    db.commit()
    db.refresh(user)

    return user


@router.post(
    "/login",
    response_model=TokenResponse,
)
def login_user(
    data: LoginRequest,
    db: Session = Depends(get_db),
):
    user = (
        db.query(Profile)
        .filter(Profile.email == data.email)
        .first()
    )

    if not user or not verify_password(
        data.password,
        user.password_hash,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    access_token = create_access_token(
        data={"sub": str(user.id)}
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
    }


@router.get(
    "/me",
    response_model=UserResponse,
)
def get_me(
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    user = (
        db.query(Profile)
        .filter(Profile.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return user


@router.put(
    "/me",
    response_model=UserResponse,
)
def update_me(
    data: dict,
    user_id: str = Depends(get_current_user_id),
    db: Session = Depends(get_db),
):
    # Find the logged-in user's profile before changing it.
    user = (
        db.query(Profile)
        .filter(Profile.id == user_id)
        .first()
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    # Only update the profile fields that this endpoint supports.
    if "full_name" in data:
        full_name = data["full_name"]

        if full_name is not None:
            full_name = str(full_name).strip()

            if len(full_name) > 100:
                raise HTTPException(
                    status_code=400,
                    detail="Full name must be 100 characters or less",
                )

        user.full_name = full_name

    db.commit()
    db.refresh(user)

    return user