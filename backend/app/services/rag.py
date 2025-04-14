from google import genai

from app.core.config import settings
from app.services.search import search_similar_chunks


# Create the Gemini client using our API key.
client = genai.Client(
    api_key=settings.GEMINI_API_KEY,
)


# Gemini model that generates the final customer-support answer.
CHAT_MODEL = "gemini-3.6-flash"


def generate_rag_answer(
    question: str,
    chatbot_id: str,
) -> str:
    # Search the chatbot's knowledge base first.
    results = search_similar_chunks(
        query=question,
        chatbot_id=chatbot_id,
        limit=5,
    )

    if not results:
        return "I couldn't find relevant information in the knowledge base."

    # Collect the text returned by Qdrant.
    context_parts = []

    for result in results:
        content = result.payload.get("content", "")

        if content:
            context_parts.append(content)

    context = "\n\n---\n\n".join(context_parts)

    # Force the model to stay grounded in the retrieved business data.
    prompt = f"""
You are a helpful customer support assistant.

Answer the customer's question using ONLY the information
provided in the knowledge base below.

If the answer is not available in the knowledge base,
say that you don't have enough information.

Do not invent business information.

Knowledge Base:
{context}

Customer Question:
{question}

Answer:
"""

    # Generate the final answer from the retrieved context.
    response = client.models.generate_content(
        model=CHAT_MODEL,
        contents=prompt,
    )

    return response.text