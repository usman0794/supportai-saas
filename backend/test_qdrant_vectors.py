from app.services.qdrant import qdrant, COLLECTION_NAME


def main():
    # Read a few stored vectors so we can confirm ingestion worked.
    result = qdrant.scroll(
        collection_name=COLLECTION_NAME,
        limit=10,
        with_payload=True,
        with_vectors=False,
    )

    points, _ = result

    print(f"Collection: {COLLECTION_NAME}")
    print(f"Vectors found: {len(points)}")

    for point in points:
        print("\n--- Vector ---")
        print(f"ID: {point.id}")
        print(f"Document ID: {point.payload.get('document_id')}")
        print(f"Chatbot ID: {point.payload.get('chatbot_id')}")
        print(f"Chunk index: {point.payload.get('chunk_index')}")
        print(f"Content: {point.payload.get('content')[:100]}...")


if __name__ == "__main__":
    main()