import os
import glob
import traceback
from typing import List
from dotenv import load_dotenv

# Suppress tokenizer warning
os.environ["TOKENIZERS_PARALLELISM"] = "false"

from langchain_community.document_loaders import BSHTMLLoader
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import FAISS
from langchain_groq import ChatGroq
from langchain_huggingface import HuggingFaceEmbeddings
from langchain.chains.retrieval import create_retrieval_chain
from langchain.chains.combine_documents import create_stuff_documents_chain
from langchain_core.prompts import ChatPromptTemplate

load_dotenv()

class RAGEngine:
    def __init__(self, docs_dir: str = "../"):
        print("Initializing RAGEngine...")
        self.docs_dir = docs_dir
        self.vector_store_path = "faiss_index"
        self.api_key = os.getenv("AI_KEY")
        print(f"API Key present: {bool(self.api_key)}")
        if not self.api_key:
            raise ValueError("AI_KEY environment variable not set")
        
        print("Initializing ChatGroq...")
        self.llm = ChatGroq(
            temperature=0,
            model_name="llama-3.3-70b-versatile",
            api_key=self.api_key
        )
        
        print("Initializing Embeddings...")
        self.embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
        self.vector_store = None
        self.chain = None
        print("RAGEngine initialized.")

    def load_documents(self) -> List:
        html_files = glob.glob(os.path.join(self.docs_dir, "*.html"))
        docs = []
        from bs4 import BeautifulSoup
        from langchain_core.documents import Document

        for file_path in html_files:
            try:
                with open(file_path, 'r', encoding='utf-8') as f:
                    soup = BeautifulSoup(f, 'lxml')
                
                # Extract text content
                text_content = soup.get_text(separator="\n", strip=True)
                
                # Extract images and try to associate with context
                images_info = []
                for img in soup.find_all('img'):
                    src = img.get('src')
                    alt = img.get('alt', '')
                    if src and not src.startswith('data:'):
                        # Encode spaces in URL to ensure valid Markdown link
                        src = src.replace(" ", "%20")
                        page_name = os.path.basename(file_path)
                        images_info.append(f"Product Image: {alt} | URL: {src} | Source: {page_name}")
                
                image_section = "\n".join(images_info)
                
                # Prepend and append images to text to ensure they are in the chunk
                combined_content = f"IMAGES IN THIS PAGE:\n{image_section}\n\nPAGE CONTENT:\n{text_content}\n\nIMAGES IN THIS PAGE:\n{image_section}"
                
                print(f"Extracted {len(images_info)} images from {file_path}")
                if images_info:
                    print(f"Sample: {images_info[0]}")
                
                docs.append(Document(page_content=combined_content, metadata={"source": file_path}))
            except Exception as e:
                print(f"Error loading {file_path}: {e}")
        return docs

    def initialize_vector_store(self):
        # Always recreate vector store to include new image data
        print("Creating new vector store with image data...")
        self._ingest_documents()

    def _ingest_documents(self):
        docs = self.load_documents()
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=5000, chunk_overlap=500)
        splits = text_splitter.split_documents(docs)
        if splits:
            self.vector_store = FAISS.from_documents(splits, self.embeddings)
            self.vector_store.save_local(self.vector_store_path)
        else:
            print("No documents to ingest.")

    def setup_chain(self):
        if not self.vector_store:
            self.initialize_vector_store()
        
        if not self.vector_store:
            print("Vector store not initialized (no documents?).")
            return

        # We will use manual retrieval in query() for multimodal support
        pass

    def query(self, input_text: str, image_data: str = None):
        try:
            if not self.vector_store:
                self.setup_chain()
            
            if not self.vector_store:
                return "I'm sorry, I don't have enough information to answer that right now."

            # Retrieve context - INCREASE retrieved docs to 5 for more context
            retriever = self.vector_store.as_retriever(search_kwargs={"k": 5})
            # Fix deprecation warning: use invoke instead of get_relevant_documents
            docs = retriever.invoke(input_text)
            context = "\n\n".join([d.page_content for d in docs])

            system_prompt = (
                "You are an efficient and helpful AI assistant for **Matie Cake**."
                "**GOAL**: Save the customer's time. Keep answers SHORT, CONCISE, and to the point (max 2-3 sentences unless asked for more)."
                "**IMAGES**: If the context mentions an image, you **MUST** display it as a CLICKABLE LINK to its source page."
                "**FORMAT**: `[![Alt Text](ImageURL)](SourcePageURL)`."
                "**CRITICAL**: You MUST use the exact `Source` filename provided in the context for the link (e.g., `set-tasty.html`). DO NOT GUESS filenames."
                "Example: `[![Flan Gato](Image/flan.png)](flan-gato.html)`."
                "If asked for a recommendation, give a 1-sentence reason and show the clickable image."
                f"Context: {context}"
            )

            from langchain_core.messages import HumanMessage, SystemMessage

            messages = [SystemMessage(content=system_prompt)]
            
            if image_data:
                print("Image data received but vision model is unavailable. Appending note.")
                # Fallback for text-only model
                input_text += "\n\n[System Note: The user uploaded an image, but the vision model is currently unavailable due to provider restrictions. Please apologize and explain that you cannot see the image, but offer to help with any text description they provide.]"
            
            print("Processing text-only request...")
            messages.append(HumanMessage(content=input_text))

            response = self.llm.invoke(messages)
            return response.content
        except Exception as e:
            print(f"Error during query execution: {e}")
            traceback.print_exc()
            raise e

# Singleton instance for easy import
rag_engine = RAGEngine()
