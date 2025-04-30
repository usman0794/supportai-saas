from app.services.embeddings import (
    create_embedding,
    EMBEDDING_DIMENSIONS,
)

from app.services.qdrant import (
    qdrant,
    create_collection_if_not_exists,
    COLLECTION_NAME,
)


def main():
    # First, confirm that Qdrant is reachable.
    print("Testing Qdrant...")

    create_collection_if_not_exists()

    print("Qdrant connection: OK")
    print(f"Collection: {COLLECTION_NAME}")

    # Now test Gemini embedding generation.
    print("\nTesting Gemini embeddings...")

    text = (
        "Welcome to SupportAI. "
        "Our customer support team is available Monday to Friday."
    )

    embedding = create_embedding(text)

    print("Gemini connection: OK")
    print(f"Embedding dimensions: {len(embedding)}")

    # Make sure Gemini returned the same size our Qdrant collection expects.
    if len(embedding) != EMBEDDING_DIMENSIONS:
        raise ValueError(
            f"Unexpected embedding size: {len(embedding)}"
        )

    print("\nAll AI services are working successfully!")


if __name__ == "__main__":
    main()