from qdrant_client.models import PointStruct

from app.services.embeddings import create_embedding
from app.services.qdrant import qdrant, COLLECTION_NAME


def store_document_chunks(
    document_id: str,
    chatbot_id: str,
    chunks: list,
) -> int:
    # Prepare all vectors before sending them to Qdrant.
    points = []

    for chunk in chunks:
        # Convert the chunk text into a semantic vector.
        embedding = create_embedding(chunk.content)

        # Keep useful metadata so we know where the vector came from.
        point = PointStruct(
            id=str(chunk.id),
            vector=embedding,
            payload={
                "document_id": str(document_id),
                "chatbot_id": str(chatbot_id),
                "chunk_id": str(chunk.id),
                "chunk_index": chunk.chunk_index,
                "content": chunk.content,
            },
        )

        points.append(point)

    # Upload all vectors together for better performance.
    if points:
        qdrant.upsert(
            collection_name=COLLECTION_NAME,
            points=points,
        )

    return len(points)