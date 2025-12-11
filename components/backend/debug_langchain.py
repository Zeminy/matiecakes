import langchain
print(f"LangChain version: {langchain.__version__}")
print(f"LangChain file: {langchain.__file__}")
print(f"Dir langchain: {dir(langchain)}")
try:
    import langchain.chains
    print("Imported langchain.chains")
except ImportError as e:
    print(f"Failed to import langchain.chains: {e}")
