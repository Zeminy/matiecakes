
# Matie Cake - Premium Bakery Website with AI Chat

A modern, responsive e-commerce website for Matie Cake, featuring a premium UI and an intelligent AI chatbot powered by RAG (Retrieval-Augmented Generation).

## Features

-   **Premium Design**: Glassmorphism UI, smooth animations, and responsive layout.
-   **AI Chat Assistant**:
    -   **Product Knowledge**: Answers questions based on website content (RAG).
    -   **Clickable Images**: Suggests products with clickable images that link directly to product pages.
    -   **Visual & Concise**: Optimized for short, helpful answers with visual cues.
    -   **Image Upload**: Users can upload images for the AI to analyze (text-only fallback currently).

## Project Structure

-   `index.html` & `*.html`: Frontend pages.
-   `src/`: CSS styles and JavaScript logic.
-   `backend/`: Python FastAPI server for the AI chat.

## Setup Instructions

### Prerequisites
-   Python 3.10+
-   Node.js (optional, for frontend dev tools if needed)

### 1. Backend Setup (AI Chat)

Navigate to the backend directory and set up the environment:

```bash
cd backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**Configuration**:
Create a `.env` file in `backend/` with your Groq API key:
```ini
GROQ_API_KEY=your_api_key_here
AI_KEY=your_api_key_here
```

**Run the Server**:
```bash
uvicorn app:app --reload
```
The server will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Simply open `index.html` in your browser.
-   For best experience, use extensions like "Live Server" in VS Code.
-   Ensure the backend is running for the Chat feature to work.

## Usage

-   Click the **Chat Bubble** in the bottom right corner.
-   Ask about products (e.g., "Tell me about the Flan Gato").
-   Click on product images in the chat to view details.

## Contributors
-   Matie Cake Team

## License

This project is licensed under the MIT License.