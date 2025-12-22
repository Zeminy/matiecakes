# Matie Cake - Premium Bakery Website with AI Features

A modern, responsive e-commerce website for Matie Cake, featuring a premium UI, an intelligent AI chatbot (RAG), and an AI-powered Product Visualizer.

## Features

-   **Premium Design**: Glassmorphism UI, smooth animations, and responsive layout.
-   **AI Chat Assistant**:
    -   **Product Knowledge**: Answers questions based on website content (RAG).
    -   **Clickable Images**: Suggests products with clickable images that link directly to product pages.
    -   **Visual & Concise**: Optimized for short, helpful answers with visual cues.
-   **AI Product Visualizer**:
    -   **Custom Box Design**: Users can select box types and items, then generate a visual preview using AI.
    -   **Instant Visualization**: See a realistic representation of the custom gift box before adding to cart.
-   **Full E-commerce Features**:
    -   Product Catalog & Categories
    -   Shopping Cart & Checkout Flow
    -   User Membership & Authentication
    -   Order Tracking

## Project Structure

-   `Root`: Frontend HTML pages (`index.html`, `product.html`, etc.)
-   `src/`: CSS styles and Frontend JavaScript logic.
-   `backend/`: Python FastAPI server for AI features (Chat & Image Generation).
-   `Image/`: Static assets.

## Setup Instructions

### Prerequisites
-   Python 3.10+
-   Node.js (optional, for frontend dev tools)

### 1. Backend Setup (Required for AI Features)

Navigate to the backend directory and set up the environment:

```bash
cd backend
python -m venv venv
# Activate Virtual Environment
source venv/bin/activate       # macOS/Linux
# venv\Scripts\activate        # Windows
```

Install dependencies:
```bash
pip install -r requirements.txt
```

**Configuration**:
Create a `.env` file in the `backend/` directory with your API keys:
```ini
GROQ_API_KEY=your_groq_api_key
AI_KEY=your_image_generation_key  # For Pollinations/other providers if needed
```

**Run the Server**:
```bash
uvicorn app:app --reload
```
The server will start at `http://127.0.0.1:8000`.

### 2. Frontend Setup

Since this is a static site with API calls:
1.  Open the root directory in VS Code.
2.  Use the **Live Server** extension to serve `index.html`.
    -   *Note*: Ensure the backend is running on port 8000 for Chat and AI Design features to work.

## Usage Guide

### AI Chat
-   Click the **Chat Bubble** in the bottom right corner.
-   Ask about products (e.g., "Tell me about the Flan Gato").

### AI Custom Box Design
-   Navigate to **Product Page (Customize)**.
-   Select a **Box Type** (e.g., Sea Breeze Box).
-   Choose **Items** to fill the box slots.
-   Policies & Assortment Selection.
-   Click **"Generate Visualization"** to see your custom box designed by AI.

## Contributors
-   Matie Cake Team

## License

This project is licensed under the MIT License.