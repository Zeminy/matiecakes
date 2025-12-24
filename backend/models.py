from sqlalchemy import Column, Integer, String, Float, DateTime, Text
from sqlalchemy.orm import declarative_base
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
    full_name = Column(String(100), nullable=True) # New field
    phone_number = Column(String(20), nullable=True) # New field
    address = Column(String(255), nullable=True) # New field
    status = Column(String(20), default='Active') # New field
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<User(username='{self.username}')>"

class WorkshopRegistration(MemberBase):
    __tablename__ = 'workshop_registrations'
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    phone_number = Column(String(20), nullable=False)
    email = Column(String(100), nullable=True)
    course_name = Column(String(100), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<WorkshopRegistration(name='{self.full_name}', course='{self.course_name}')>"

# --- Payment Database Models ---
class Payment(PaymentBase):
    __tablename__ = 'payments'
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, nullable=False) # In a real microservice, this might reference Member Service ID
    amount = Column(Float, nullable=False)
    status = Column(String(20), default='pending') # pending, completed, failed
    order_info = Column(Text, nullable=True) # JSON or description of items
    timestamp = Column(DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f"<Payment(id={self.id}, amount={self.amount}, status='{self.status}')>"

# --- Administration Database Models ---
class WarehouseInventory(AdminBase):
    __tablename__ = 'warehouse_inventory'
    
    id = Column(Integer, primary_key=True, index=True)
    product_name = Column(String(100), unique=True, nullable=False)
    quantity = Column(Integer, default=0)
    last_restock = Column(DateTime, default=datetime.utcnow)
