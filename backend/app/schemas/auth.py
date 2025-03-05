"""
Pydantic schemas for authentication.

These schemas define the structure of data
sent to and returned from authentication endpoints.
"""

from uuid import UUID

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    """
    Data required when creating a new account.
    """

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72,
    )

    full_name: str | None = Field(
        default=None,
        max_length=100,
    )


class LoginRequest(BaseModel):
    """
    Data required when logging into an account.
    """

    email: EmailStr

    password: str = Field(
        min_length=8,
        max_length=72,
    )


class UserResponse(BaseModel):
    """
    Public user information returned by the API.

    The password_hash is intentionally NOT included.
    """

    id: UUID
    email: EmailStr
    full_name: str | None = None
    avatar_url: str | None = None


class TokenResponse(BaseModel):
    """
    JWT token returned after successful authentication.
    """

    access_token: str
    token_type: str = "bearer"