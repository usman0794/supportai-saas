from app.services.tool_calling import generate_tool_answer


question = "What is the status of CARD123?"

answer = generate_tool_answer(question)

print("Final answer:")
print(answer)