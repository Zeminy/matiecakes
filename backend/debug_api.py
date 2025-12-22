
import os
import requests
from dotenv import load_dotenv

load_dotenv(override=True)

api_token = os.getenv("HUGGINGFACEHUB_API_TOKEN") or os.getenv("AI_KEY")

if not api_token:
    print("❌ No API Token found in env.")
    exit()

print(f"🔑 Using Token: {api_token[:4]}...{api_token[-4:]}")

configurations = [
    {
        "name": "Router - SD v1.5",
        "url": "https://router.huggingface.co/hf-inference/models/runwayml/stable-diffusion-v1-5",
    },
    {
        "name": "Router - SD 2.1",
        "url": "https://router.huggingface.co/hf-inference/models/stabilityai/stable-diffusion-2-1",
    },
    {
        "name": "Legacy - SD v1.5",
        "url": "https://api-inference.huggingface.co/models/runwayml/stable-diffusion-v1-5",
    },
    {
        "name": "Legacy - SD 2.1",
        "url": "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-2-1",
    }
]

headers = {"Authorization": f"Bearer {api_token}"}
payload = {"inputs": "A photo of a cake box."}

print("\n--- Starting Connection Tests ---")
for config in configurations:
    print(f"\nTesting: {config['name']}")
    print(f"URL: {config['url']}")
    try:
        response = requests.post(config['url'], headers=headers, json=payload, timeout=10)
        print(f"Status: {response.status_code}")
        if response.status_code == 200:
            print("✅ SUCCESS!")
        else:
            print(f"❌ Failed: {response.text[:200]}")
    except Exception as e:
        print(f"❌ Exception: {e}")
