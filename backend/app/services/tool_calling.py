import time

from google import genai
from google.genai import types

from app.core.config import settings
from app.services.tools import get_card_status


client = genai.Client(api_key=settings.GEMINI_API_KEY)

CHAT_MODEL = "gemini-3.6-flash"


# ---------------------------------------------------------------------------
# Gemini tool definition
# ---------------------------------------------------------------------------

card_status_tool = types.Tool(
    function_declarations=[
        types.FunctionDeclaration(
            name="get_card_status",
            description=(
                "Get the current status of a customer's bank card. "
                "Use this when the user asks about their card status."
            ),
            parameters=types.Schema(
                type=types.Type.OBJECT,
                properties={
                    "card_number": types.Schema(
                        type=types.Type.STRING,
                        description=(
                            "The customer's card number, "
                            "for example CARD123."
                        ),
                    )
                },
                required=["card_number"],
            ),
        )
    ]
)


# ---------------------------------------------------------------------------
# Gemini request helper
# ---------------------------------------------------------------------------

def generate_content_with_retry(*args, **kwargs):
    """
    Send a request to Gemini and retry temporary failures.

    Gemini can occasionally return a 503 when the service is
    temporarily unavailable or experiencing high demand.
    """

    last_error = None

    for attempt in range(3):
        try:
            return client.models.generate_content(
                *args,
                **kwargs,
            )

        except Exception as error:
            last_error = error

            # Retry only the first two failures.
            if attempt < 2:
                wait_seconds = 2 * (attempt + 1)
                time.sleep(wait_seconds)
            else:
                raise last_error


# ---------------------------------------------------------------------------
# Detect whether a tool is required
# ---------------------------------------------------------------------------

def detect_tool_call(question: str):
    """
    Ask Gemini whether the user's question requires a tool.
    """

    response = generate_content_with_retry(
        model=CHAT_MODEL,
        contents=question,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a tool-selection assistant for a customer "
                "support system. "
                "If the user asks about the status of a bank card, "
                "use the get_card_status tool. "
                "For questions unrelated to card status, "
                "do not call any tool."
            ),
            tools=[card_status_tool],
        ),
    )

    return response


# ---------------------------------------------------------------------------
# Execute the requested tool
# ---------------------------------------------------------------------------

def execute_tool_call(function_call):
    """
    Execute the function requested by Gemini.
    """

    if function_call.name == "get_card_status":
        card_number = function_call.args.get("card_number")

        return get_card_status(card_number)

    return {
        "found": False,
        "message": f"Unknown tool: {function_call.name}",
    }


# ---------------------------------------------------------------------------
# Complete Gemini function-calling flow
# ---------------------------------------------------------------------------

def generate_tool_answer(question: str):
    """
    Run the complete Gemini function-calling flow.

    1. Gemini decides whether a tool is needed.
    2. FastAPI executes the requested tool.
    3. The tool result is sent back to Gemini.
    4. Gemini generates the final human-readable answer.

    Returns:
        str: Final tool-based answer.
        None: If Gemini does not request a tool.
    """

    # Step 1: Ask Gemini whether a tool is needed.
    response = detect_tool_call(question)

    # No tool requested.
    if not response.function_calls:
        return None

    # For now, SupportAI has one available tool.
    function_call = response.function_calls[0]

    # Step 2: Execute the requested Python function.
    tool_result = execute_tool_call(function_call)

    # Step 3: Send the original conversation + tool result
    # back to Gemini so it can produce the final answer.
    contents = [
        types.Content(
            role="user",
            parts=[
                types.Part.from_text(
                    text=question,
                ),
            ],
        ),
        response.candidates[0].content,
        types.Content(
            role="user",
            parts=[
                types.Part.from_function_response(
                    name=function_call.name,
                    response=tool_result,
                )
            ],
        ),
    ]

    # Step 4: Gemini generates the final response.
    final_response = generate_content_with_retry(
        model=CHAT_MODEL,
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=(
                "You are a helpful customer support assistant. "
                "Use the tool result to answer the user's question clearly. "
                "Do not mention internal tools or function calling. "
                "Do not invent information that is not present "
                "in the tool result."
            ),
        ),
    )

    return final_response.text