"""
Security utilities for SupportAI.

This module handles:
- Password hashing
- Password verification
- JWT access-token creation
- JWT token decoding
"""

from datetime import datetime, timedelta, timezone

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import JWTError, jwt
from passlib.context import CryptContext

from app.core.config import settings


# ---------------------------------------------------------
# Password hashing
# ---------------------------------------------------------

# bcrypt is used to securely hash user passwords.
# The original password is never stored in the database.
pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
)

def hash_password(password: str) -> str:
    """
    Hash a plain-text password.

    Returns:
        A secure bcrypt password hash.
    """
    return pwd_context.hash(password)


def verify_password(
    plain_password: str,
    hashed_password: str,
) -> bool:
    """
    Verify a plain-text password against a stored hash.

    Returns:
        True if the password matches, otherwise False.
    """
    return pwd_context.verify(
        plain_password,
        hashed_password,
    )


# ---------------------------------------------------------
# JWT configuration
# ---------------------------------------------------------

# Algorithm used to sign JWT access tokens.
ALGORITHM = "HS256"

# Access token lifetime.
ACCESS_TOKEN_EXPIRE_MINUTES = 60

security = HTTPBearer()


# ---------------------------------------------------------
# JWT creation
# ---------------------------------------------------------

def create_access_token(
    data: dict,
    expires_delta: timedelta | None = None,
) -> str:
    """
    Create a signed JWT access token.

    Args:
        data: Information to store inside the token.
        expires_delta: Optional custom expiration time.

    Returns:
        Encoded JWT token.
    """

    # Copy the data so we don't modify the original dictionary.
    to_encode = data.copy()

    # Use UTC time for token expiration.
    current_time = datetime.now(timezone.utc)

    # Set the expiration time.
    if expires_delta:
        expire = current_time + expires_delta
    else:
        expire = current_time + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        )

    # Add expiration timestamp to the JWT payload.
    to_encode.update(
        {
            "exp": expire,
        }
    )

    # Sign and encode the JWT.
    encoded_jwt = jwt.encode(
        to_encode,
        settings.JWT_SECRET_KEY,
        algorithm=ALGORITHM,
    )

    return encoded_jwt


# ---------------------------------------------------------
# JWT decoding
# ---------------------------------------------------------

def decode_access_token(token: str) -> dict | None:
    """
    Decode and validate a JWT access token.

    Returns:
        Token payload if valid, otherwise None.
    """

    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[ALGORITHM],
        )

        return payload

    except JWTError:
        return None

def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Depends(security),
) -> str:
    """
    Extract and validate the user ID from the JWT token.
    """

    token = credentials.credentials

    payload = decode_access_token(token)

    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id = payload.get("sub")

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token payload",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id