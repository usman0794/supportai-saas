from qdrant_client import QdrantClient
from qdrant_client.models import (
    Distance,
    PayloadSchemaType,
    VectorParams,
)

from app.core.config import settings


# Connect to our Qdrant Cloud cluster.
qdrant = QdrantClient(
    url=settings.QDRANT_URL,
    api_key=settings.QDRANT_API_KEY,
)


# All SupportAI knowledge-base vectors use this collection.
COLLECTION_NAME = "supportai_documents"

# Gemini embeddings are configured to return 1536 values.
EMBEDDING_DIMENSIONS = 1536


def create_collection_if_not_exists() -> None:
    # Check whether our collection already exists.
    collections = qdrant.get_collections().collections

    collection_names = [
        collection.name
        for collection in collections
    ]

    # Create the collection only the first time.
    if COLLECTION_NAME not in collection_names:
        qdrant.create_collection(
            collection_name=COLLECTION_NAME,
            vectors_config=VectorParams(
                size=EMBEDDING_DIMENSIONS,
                distance=Distance.COSINE,
            ),
        )

    # Create an index so we can efficiently filter by chatbot.
    create_chatbot_index()


def create_chatbot_index() -> None:
    # Qdrant requires an index for filtered payload fields.
    qdrant.create_payload_index(
        collection_name=COLLECTION_NAME,
        field_name="chatbot_id",
        field_schema=PayloadSchemaType.KEYWORD,
    )