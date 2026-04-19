from db_utils import get_db_session
from models import User
from app import get_password_hash

def seed_users():
    print("Seeding Users...")
    session = get_db_session('member')
    try:
        users_to_add = [
            {"username": "admin", "email": "admin@matie.com", "full_name": "Admin User", "phone": "0987654321", "address": "123 Main St"},
            {"username": "customer1", "email": "cust1@matie.com", "full_name": "Nguyen Van A", "phone": "0912345678", "address": "456 Bakery Lane"},
            {"username": "customer2", "email": "cust2@matie.com", "full_name": "Tran Thi B", "phone": "0999888777", "address": "789 Cake Blvd"},
        ]
        
        count = 0
        for u_data in users_to_add:
            existing = session.query(User).filter_by(username=u_data["username"]).first()
            if not existing:
                new_user = User(
                    username=u_data["username"],
                    password_hash=get_password_hash("password123"),
                    email=u_data["email"],
                    full_name=u_data["full_name"],
                    phone_number=u_data["phone"],
                    address=u_data["address"],
                    status="Active"
                )
                session.add(new_user)
                count += 1
                
        session.commit()
        print(f"Successfully added {count} users.")
    except Exception as e:
        print(f"Error seeding users: {e}")
        session.rollback()
    finally:
        session.close()

if __name__ == "__main__":
    seed_users()
