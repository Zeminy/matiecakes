import random
from datetime import datetime, timedelta
from db_utils import get_db_session
from models import User, Payment

def seed_payments():
    print("Seeding Payment Data...")
    
    member_session = get_db_session('member')
    payment_session = get_db_session('payment')
    
    try:
        # Get all users
        users = member_session.query(User).all()
        print(f"Found {len(users)} users.")
        
        if not users:
            print("No users found. Please register some users first.")
            return
        
        # Check existing payments
        existing_count = payment_session.query(Payment).count()
        print(f"Existing payments: {existing_count}")
        
        # Create some sample payments
        for _ in range(15):
            user = random.choice(users)
            amount = round(random.uniform(10, 500), 2)
            
            payment = Payment(
                user_id=user.id,
                amount=amount,
                status='completed',
                order_info=f'Cake order for {user.username}',
                timestamp=datetime.utcnow() - timedelta(days=random.randint(0, 60))
            )
            payment_session.add(payment)
            print(f"Created payment #{payment_session.query(Payment).count() + 1}: ${amount} for user {user.username}")
        
        payment_session.commit()
        print("Payment seeding complete!")
        
    except Exception as e:
        print(f"Error seeding payments: {e}")
        payment_session.rollback()
    finally:
        member_session.close()
        payment_session.close()

if __name__ == "__main__":
    seed_payments()
