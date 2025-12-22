from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

# Database Connection URLs
# Format: postgresql+pg8000://user:password@host:port/dbname
MEMBER_DB_URL = "postgresql+pg8000://admin:password@localhost:5432/member_db"
PAYMENT_DB_URL = "postgresql+pg8000://admin:password@localhost:5432/payment_db"
ADMIN_DB_URL = "postgresql+pg8000://admin:password@localhost:5432/admin_db"

def get_db_engine(db_name: str):
    """
    Creates a SQLAlchemy engine for the specified database.
    Supported db_names: 'member', 'payment', 'admin'
    """
    if db_name == 'member':
        return create_engine(MEMBER_DB_URL)
    elif db_name == 'payment':
        return create_engine(PAYMENT_DB_URL)
    elif db_name == 'admin':
        return create_engine(ADMIN_DB_URL)
    else:
        raise ValueError("Invalid database name. Choose 'member', 'payment', or 'admin'.")

def get_db_session(db_name: str):
    """
    Creates a new SQLAlchemy Session for the specified database.
    This is useful for executing queries.
    """
    engine = get_db_engine(db_name)
    Session = sessionmaker(bind=engine)
    return Session()

def test_connections():
    """
    Test connectivity to all multiple databases.
    """
    databases = ['member', 'payment', 'admin']
    results = {}
    
    for db in databases:
        try:
            engine = get_db_engine(db)
            with engine.connect() as conn:
                # Execute valid SQL using text() construct
                from sqlalchemy import text
                conn.execute(text("SELECT 1"))
            results[db] = "Connected successfully"
        except Exception as e:
            results[db] = f"Connection failed: {e}"
            
    return results

if __name__ == "__main__":
    print("Testing database connections...")
    status = test_connections()
    for db, msg in status.items():
        print(f"[{db.upper()} DB]: {msg}")
