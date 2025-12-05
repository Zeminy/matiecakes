from groq import Groq
from dotenv import load_dotenv
import os

load_dotenv()
client = Groq(api_key=os.getenv("AI_KEY"))

messages = []

print("Start chatting with Groq AI (type 'quit' to exit)")

while True:
    user_input = input("You: ")
    if user_input.lower() == "quit":
        break

    messages.append({"role": "user", "content": user_input})

    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=messages
    )

    reply = response.choices[0].message.content
    print("AI:", reply)

    # Add AI response to history for context
    messages.append({"role": "assistant", "content": reply})
