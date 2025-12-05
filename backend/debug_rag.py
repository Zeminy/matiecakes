import os
import sys
from dotenv import load_dotenv

# Ensure backend directory is in path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from rag_engine import rag_engine

def debug_query(query_text):
    print(f"\n{'='*50}")
    print(f"DEBUGGING QUERY: {query_text}")
    print(f"{'='*50}\n")

    # 1. Inspect Vector Store
    if not rag_engine.vector_store:
        print("Vector store not initialized. Initializing...")
        rag_engine.setup_chain()
    
    # 2. Manual Retrieval
    print("--- RETRIEVED DOCUMENTS ---")
    retriever = rag_engine.vector_store.as_retriever(search_kwargs={"k": 4})
    docs = retriever.invoke(query_text)
    
    for i, doc in enumerate(docs):
        print(f"\n[Doc {i+1}] Source: {doc.metadata.get('source', 'Unknown')}")
        content_preview = doc.page_content[:300] + "..." if len(doc.page_content) > 300 else doc.page_content
        print(f"Content Preview:\n{content_preview}")
    
    print(f"\n{'='*50}\n")
    
    # 3. Full Generation
    print("--- GENERATED RESPONSE ---")
    response = rag_engine.query(query_text)
    print(response)
    print(f"\n{'='*50}\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "Tell me about Matie Cake products. What do you recommend for a gift?"
    
    debug_query(query)
