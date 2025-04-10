from app.services.embeddings import create_embedding
from app.services.qdrant import qdrant, COLLECTION_NAME


def search_similar_chunks(
    query: str,
    chatbot_id: str,
    limit: int = 5,
):
    # Convert the user's question into the same vector format as our documents.
    query_embedding = create_embedding(query)

    # Search only inside this chatbot's knowledge base.
    results = qdrant.query_points(
        collection_name=COLLECTION_NAME,
        query=query_embedding,
        query_filter={
            "must": [
                {
                    "key": "chatbot_id",
                    "match": {
                        "value": chatbot_id,
                    },
                }
            ]
        },
        limit=limit,
        with_payload=True,
    )

    return results.points