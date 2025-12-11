import os
import requests
from dotenv import load_dotenv
load_dotenv()

load_dotenv()
api_key = os.getenv("AI_KEY")
resp = requests.get(
    "https://api.groq.com/openai/v1/models",
    headers={"Authorization": f"Bearer {api_key}", "Content-Type": "application/json"}
)
data = resp.json()
import json
print(json.dumps(data, indent=2))
