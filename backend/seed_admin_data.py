import random
from datetime import datetime, timedelta
from db_utils import get_db_session
from models import User, ShippingStatus, CustomerProfile

def seed_admin_data():
    print("Seeding Admin Data...")
    
    member_session = get_db_session('member')
    admin_session = get_db_session('admin')
    
    try:
        # 1. Sync/Seed Customer Profiles
        users = member_session.query(User).all()
        print(f"Found {len(users)} users.")
        
        for user in users:
            # Check if profile exists
            profile = admin_session.query(CustomerProfile).filter(CustomerProfile.user_id == user.id).first()
            if not profile:
                # Create random profile
                vip_levels = ['New', 'Bronze', 'Silver', 'Gold']
                profile = CustomerProfile(
                    user_id=user.id,
                    full_name=user.username, # Default to username if no name
                    email=user.email,
                    vip_level=random.choice(vip_levels),
                    status='Active',
                    total_spend=round(random.uniform(0, 500), 2),
                    created_at=user.created_at
                )
                admin_session.add(profile)
                print(f"Created profile for {user.username}")
        
        # 2. Seed Shipping Data
        # Generate some random orders
        statuses = ['Pending', 'Shipped', 'Delivered', 'Cancelled']
        
        # Check if we have enough shipping data
        count = admin_session.query(ShippingStatus).count()
        if count < 10:
            for _ in range(10):
                # Pick a random user for the order
                if users:
                    user = random.choice(users)
                    name = user.username
                else:
                    name = "Guest User"

                status = random.choice(statuses)
                order_id = int(datetime.utcnow().timestamp()) + random.randint(1, 100000)
                
                shipping = ShippingStatus(
                    order_id=order_id,
                    customer_name=name,
                    phone_number=f"09{random.randint(10000000, 99999999)}",
                    status=status,
                    updated_at=datetime.utcnow() - timedelta(days=random.randint(0, 30))
                )
                admin_session.add(shipping)
                print(f"Created order #{order_id} ({status})")
        
        admin_session.commit()
        print("Admin data seeded successfully.")
        
    except Exception as e:
        print(f"Error seeding data: {e}")
        admin_session.rollback()
    finally:
        member_session.close()
        admin_session.close()

if __name__ == "__main__":
    seed_admin_data()
