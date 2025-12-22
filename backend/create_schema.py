from db_utils import get_db_engine
from models import MemberBase, PaymentBase, AdminBase
from sqlalchemy.exc import SQLAlchemyError

def create_tables():
    print("Initializing Database Schemas...")

    # 1. Member DB
    try:
        print("Creating tables for MEMBER_DB...")
        member_engine = get_db_engine('member')
        MemberBase.metadata.create_all(member_engine)
        print("MEMBER_DB tables created successfully.")
    except Exception as e:
        print(f"Error creating MEMBER_DB tables: {e}")

    # 2. Payment DB
    try:
        print("Creating tables for PAYMENT_DB...")
        payment_engine = get_db_engine('payment')
        PaymentBase.metadata.create_all(payment_engine)
        print("PAYMENT_DB tables created successfully.")
    except Exception as e:
        print(f"Error creating PAYMENT_DB tables: {e}")

    # 3. Admin DB
    try:
        print("Creating tables for ADMIN_DB...")
        admin_engine = get_db_engine('admin')
        AdminBase.metadata.create_all(admin_engine)
        print("ADMIN_DB tables created successfully.")
    except Exception as e:
        print(f"Error creating ADMIN_DB tables: {e}")

if __name__ == "__main__":
    create_tables()
