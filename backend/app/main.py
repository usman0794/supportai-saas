from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.database.connection import engine

from app.api.v1.auth import router as auth_router
from app.api.v1.chatbots import router as chatbot_router
from app.api.v1.documents import router as document_router
from app.api.v1.chat import router as chat_router
from app.api.v1.conversations import router as conversation_router
from app.api.v1.widget import router as widget_router
from app.api.v1.analytics import router as analytics_router


app = FastAPI(
    title="SupportAI API",
    description="AI Customer Support SaaS API",
    version="1.0.0",
)


# Allow the Next.js frontend to communicate with FastAPI.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:5500",
        "http://127.0.0.1:5500",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# API routes
# ---------------------------------------------------------------------------

app.include_router(
    auth_router,
    prefix="/api/v1",
)

app.include_router(
    chatbot_router,
    prefix="/api/v1",
)

app.include_router(
    document_router,
    prefix="/api/v1",
)

app.include_router(
    conversation_router,
    prefix="/api/v1",
)

app.include_router(
    chat_router,
    prefix="/api/v1",
)

app.include_router(
    widget_router,
    prefix="/api/v1",
)

app.include_router(
    analytics_router,
    prefix="/api/v1",
)

# ---------------------------------------------------------------------------
# Health
# ---------------------------------------------------------------------------

@app.get("/api/v1/health")
def health_check():
    return {
        "status": "ok",
        "message": "SupportAI API is running",
    }


@app.get("/api/v1/config-test")
def config_test():
    return {
        "database_configured": bool(settings.DATABASE_URL),
        "openai_configured": bool(settings.OPENAI_API_KEY),
        "qdrant_configured": bool(settings.QDRANT_URL),
        "supabase_configured": bool(settings.SUPABASE_URL),
    }


@app.get("/api/v1/db-test")
def database_test():
    try:
        with engine.connect() as connection:
            result = connection.execute(text("SELECT 1"))
            value = result.scalar()

        return {
            "status": "ok",
            "database": "connected",
            "test_result": value,
        }

    except SQLAlchemyError as error:
        return {
            "status": "error",
            "database": "connection_failed",
            "error": str(error),
        }