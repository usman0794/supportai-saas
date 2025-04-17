from app.services.rag import generate_rag_answer
from app.services.tool_calling import generate_tool_answer


def generate_ai_answer(question: str, chatbot_id: str) -> str:
    """
    Decide whether the question should use a tool or RAG.

    Tool questions use Gemini function calling.
    Other questions use the existing RAG pipeline.
    """

    # First, check whether Gemini wants to use one of our tools.
    tool_answer = generate_tool_answer(question)

    if tool_answer:
        return tool_answer

    # If no tool is needed, use the existing knowledge-base RAG flow.
    return generate_rag_answer(
        question=question,
        chatbot_id=chatbot_id,
    )