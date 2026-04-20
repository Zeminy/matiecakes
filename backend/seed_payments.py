import random
from datetime import datetime, timedelta
from db_utils import get_db_session
from models import User, Order, OrderDetail, Payment, WarehouseInventory

def seed_payments():
    print("Seeding Payment Data (v2.0 schema)...")

    member_session = get_db_session('member')
    payment_session = get_db_session('payment')
    admin_session   = get_db_session('admin')

    try:
        # --- 1. Get users from member_db ---
        users = member_session.query(User).all()
        print(f"Found {len(users)} users.")
        if not users:
            print("No users found. Please run seed_users.py first.")
            return

        # --- 2. Get products from warehouse_inventory (admin_db) ---
        products = admin_session.query(WarehouseInventory).all()
        print(f"Found {len(products)} products in inventory.")
        if not products:
            print("No products found. Please run seed_inventory.py first.")
            return

        # --- 3. Check existing orders ---
        existing = payment_session.query(Order).count()
        print(f"Existing orders: {existing}")

        # --- 4. Create 15 sample orders ---
        for i in range(15):
            user = random.choice(users)

            # Pick 1-3 random products for this order
            picked = random.sample(products, k=min(random.randint(1, 3), len(products)))

            # Build order_details rows + calculate total
            total = 0.0
            detail_rows = []
            for product in picked:
                qty        = random.randint(1, 3)
                unit_price = round(random.uniform(5.0, 50.0), 2)
                subtotal   = round(qty * unit_price, 2)
                total     += subtotal
                detail_rows.append({
                    'product_name': product.product_name,
                    'quantity':     qty,
                    'unit_price':   unit_price,
                    'subtotal':     subtotal,
                })

            total = round(total, 2)
            created_at = datetime.utcnow() - timedelta(days=random.randint(0, 60))

            # Create Order
            order = Order(
                user_id        = user.id,
                total_amount   = total,
                status         = 'completed',
                payment_method = random.choice(['credit_card', 'cash', 'bank_transfer']),
                created_at     = created_at,
            )
            payment_session.add(order)
            payment_session.flush()  # get order.id before commit

            # Create OrderDetails
            for d in detail_rows:
                detail = OrderDetail(
                    order_id     = order.id,
                    product_name = d['product_name'],
                    quantity     = d['quantity'],
                    unit_price   = d['unit_price'],
                    subtotal     = d['subtotal'],
                )
                payment_session.add(detail)

            # Create Payment linked to this Order
            payment = Payment(
                order_id  = order.id,
                user_id   = user.id,
                amount    = total,
                status    = 'completed',
                timestamp = created_at,
            )
            payment_session.add(payment)

            items_str = ', '.join(f"{d['product_name'].encode('ascii','ignore').decode()} x{d['quantity']}" for d in detail_rows)
            print(f"  Order #{order.id}: ${total} | {user.username} | [{items_str}]")

        payment_session.commit()
        print("Payment seeding complete!")

    except Exception as e:
        print(f"Error seeding payments: {e}")
        payment_session.rollback()
    finally:
        member_session.close()
        payment_session.close()
        admin_session.close()

if __name__ == "__main__":
    seed_payments()
