from app.services.search import search_similar_chunks


CHATBOT_ID = "1ed84d2b-5dd3-40b6-aa73-7df9d744acba"


def main():
    # Ask a question that should be answered from our test document.
    question = "What are the customer support hours?"

    print(f"Question: {question}")
    print("\nSearching knowledge base...\n")

    results = search_similar_chunks(
        query=question,
        chatbot_id=CHATBOT_ID,
        limit=3,
    )

    print(f"Results found: {len(results)}")

    for result in results:
        print("\n--- Result ---")
        print(f"Score: {result.score}")
        print(f"Chunk: {result.payload.get('chunk_index')}")
        print(f"Content:\n{result.payload.get('content')}")


if __name__ == "__main__":
    main()