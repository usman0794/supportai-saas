from google import genai
from google.genai import types

from app.core.config import settings


# Create the Gemini client using our private API key.
client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
)


# Gemini's current embedding model for our RAG knowledge base.
EMBEDDING_MODEL = "gemini-embedding-2"

# Keep this at 1536 because our Qdrant collection uses 1536 dimensions.
EMBEDDING_DIMENSIONS = 1536


def create_embedding(text: str) -> list[float]:
    # Convert the text into a vector for semantic similarity search.
    response = client.models.embed_content(
        model=EMBEDDING_MODEL,
        contents=text,
        config=types.EmbedContentConfig(
            output_dimensionality=EMBEDDING_DIMENSIONS,
        ),
    )

    # Return the vector values that Qdrant will store.
    return response.embeddings[0].values