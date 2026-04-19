from sqlalchemy import Column, Integer, String, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import declarative_base, relationship
from datetime import datetime

# Bases for different databases
MemberBase = declarative_base()
PaymentBase = declarative_base()
AdminBase = declarative_base()

# --- Member Database Models ---
class User(MemberBase):
    __tablename__ = 'users'
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(128), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    full_name = Column(String(100), nullable=True)
    phone_number = Column(String(20), nullable=True)
    address = Column(String(255), nullable=True)
    status = Column(String(20), default='Active')
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships (within member_db)
    workshop_registrations = relationship('WorkshopRegistration', back_populates='user')

    def __repr__(self):
        return f"<User(username='{self.username}')>"

class WorkshopRegistration(MemberBase):
    __tablename__ = 'workshop_registrations'
    
    id = Column(Integer, primary_key=True, index=True)
    # [IMPROVED] Linked to users table via user_id instead of duplicating name/email
    user_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    # Keep fallback fields for guest (non-registered) registrants
    guest_name = Column(String(100), nullable=True)
    guest_phone = Column(String(20), nullable=True)
    guest_email = Column(String(100), nullable=True)
    course_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship
    user = relationship('User', back_populates='workshop_registrations')

    def __repr__(self):
        return f"<WorkshopRegistration(user_id={self.user_id}, course='{self.course_name}')>"

# --- Payment Database Models ---

class Order(PaymentBase):
    __tablename__ = 'orders'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False)       # Logical FK -> member_db.users.id
    total_amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, completed, failed, cancelled
    payment_method = Column(String(50), nullable=True)  # e.g. 'credit_card', 'cash'
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationship (within payment_db)
    order_details = relationship('OrderDetail', back_populates='order')

    def __repr__(self):
        return f"<Order(id={self.id}, user_id={self.user_id}, status='{self.status}')>"

class OrderDetail(PaymentBase):
    __tablename__ = 'order_details'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False)
    product_name = Column(String(100), nullable=False)  # Logical FK -> admin_db.warehouse_inventory.product_name
    quantity = Column(Integer, nullable=False, default=1)
    unit_price = Column(Float, nullable=False)
    subtotal = Column(Float, nullable=False)

    # Relationship
    order = relationship('Order', back_populates='order_details')

    def __repr__(self):
        return f"<OrderDetail(order_id={self.order_id}, product='{self.product_name}', qty={self.quantity})>"

class Payment(PaymentBase):
    __tablename__ = 'payments'

    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, ForeignKey('orders.id'), nullable=False, unique=True)
    user_id = Column(Integer, nullable=False)    # Logical FK -> member_db.users.id
    amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending')  # pending, completed, failed
    timestamp = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Payment(id={self.id}, order_id={self.order_id}, status='{self.status}')>"

# --- Administration Database Models ---
class WarehouseInventory(AdminBase):
    __tablename__ = 'warehouse_inventory'
    
    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    last_restock = Column(DateTime, default=datetime.utcnow)

class ShippingStatus(AdminBase):
    __tablename__ = 'shipping_status'
    
    id = Column(Integer, primary_key=True, index=True)
    order_id = Column(Integer, unique=True, nullable=False)  # Logical FK -> payment_db.orders.id
    customer_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=True)
    status = Column(String(50), default='Pending')  # Pending, Shipped, Delivered, Cancelled
    updated_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<ShippingStatus(order_id={self.order_id}, status='{self.status}')>"

class CustomerProfile(AdminBase):
    __tablename__ = 'customer_profiles'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, unique=True, nullable=False)  # Logical FK -> member_db.users.id
    full_name = Column(String(100), nullable=True)
    email = Column(String(100), nullable=True)
    vip_level = Column(String(20), default='New')  # New, Bronze, Silver, Gold
    status = Column(String(20), default='Active')
    total_spend = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CustomerProfile(user_id={self.user_id}, vip='{self.vip_level}')>"

class CakeAnalytics(AdminBase):
    __tablename__ = 'cake_analytics'
    
    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), unique=True, nullable=False)  # Aligned with warehouse_inventory.product_name
    quantity_sold = Column(Integer, default=0)
    last_updated = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<CakeAnalytics(product='{self.product_name}', sold={self.quantity_sold})>"
