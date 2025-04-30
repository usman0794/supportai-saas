from app.services.rag import generate_rag_answer


CHATBOT_ID = "1ed84d2b-5dd3-40b6-aa73-7df9d744acba"


def main():
    # Ask a real question about information stored in our document.
    question = "What are the customer support hours?"

    print(f"Question: {question}")
    print("\nGenerating RAG answer...\n")

    answer = generate_rag_answer(
        question=question,
        chatbot_id=CHATBOT_ID,
    )

    print("Answer:")
    print(answer)


if __name__ == "__main__":
    main()