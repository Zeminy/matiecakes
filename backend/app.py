from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag_engine import rag_engine
import uvicorn
import os
import warnings

# Suppress numpy warnings on Windows (float128 not fully supported)
warnings.filterwarnings("ignore", category=RuntimeWarning, module="numpy")

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None

@app.on_event("startup")
async def startup_event():
    print("Initializing RAG Engine...")
    try:
        rag_engine.setup_chain()
        print("RAG Engine initialized successfully.")
    except Exception as e:
        print(f"Error initializing RAG Engine: {e}")

@app.post("/chat")
async def chat(request: ChatRequest):
    try:
        response = rag_engine.query(request.message, request.image)
        return {"response": response}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
