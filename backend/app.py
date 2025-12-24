from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from fastapi.middleware.cors import CORSMiddleware
from rag_engine import rag_engine
import uvicorn
import os
import warnings
from dotenv import load_dotenv
load_dotenv()
# Suppress numpy warnings on Windows (float128 not fully supported)
# Suppress numpy warnings on Windows (float128 not fully supported)
warnings.filterwarnings("ignore", category=RuntimeWarning, module="numpy")

# Database & Auth Imports
import bcrypt
from db_utils import get_db_session
from models import User, Payment, WarehouseInventory, WorkshopRegistration
from sqlalchemy.orm import Session
from datetime import datetime
import requests
import io

import base64
import json # Added json import
# Password Hashing
def get_password_hash(password):
    # Truncate to 72 bytes to avoid bcrypt limitation and encode
    pwd_bytes = password[:72].encode('utf-8')
    salt = bcrypt.gensalt()
    hashed_bytes = bcrypt.hashpw(pwd_bytes, salt)
    return hashed_bytes.decode('utf-8') # Return string for storage

def verify_password(plain_password, hashed_password):
    plain_password_bytes = plain_password[:72].encode('utf-8')
    hashed_password_bytes = hashed_password.encode('utf-8')
    return bcrypt.checkpw(plain_password_bytes, hashed_password_bytes)

app = FastAPI()

# Allow CORS for local development
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

from typing import Optional

class ChatRequest(BaseModel):
    message: str
    image: Optional[str] = None

class RegisterRequest(BaseModel):
    username: str
    password: str
    email: str
    full_name: Optional[str] = None
    phone_number: Optional[str] = None
    address: Optional[str] = None

class LoginRequest(BaseModel):
    username: str
    password: str

class PaymentRequest(BaseModel):
    user_id: int
    amount: float
    order_info: Optional[str] = None
    status: str = "pending"

class AnalyticsRequest(BaseModel):
    cake_name: str
    quantity: int = 1

class ShippingUpdateRequest(BaseModel):
    status: str

# ... (startup event and chat endpoint same) ...

# --- Member Service ---
@app.post("/register")
async def register(request: RegisterRequest):
    session = get_db_session('member')
    try:
        # Check if user exists
        existing_user = session.query(User).filter((User.username == request.username) | (User.email == request.email)).first()
        if existing_user:
            raise HTTPException(status_code=400, detail="Username or Email already registered")
        
        hashed_password = get_password_hash(request.password)
        new_user = User(
            username=request.username, 
            password_hash=hashed_password, 
            email=request.email,
            full_name=request.full_name,
            phone_number=request.phone_number,
            address=request.address,
            status="Active"
        )
        session.add(new_user)
        session.commit()
        return {"message": "User registered successfully", "username": new_user.username}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

# ... (login and payment code same) ...

@app.get("/admin/shipping")
async def get_shipping_status():
    """Fetch shipping status directly from payment_db"""
    payment_session = get_db_session('payment')
    member_session = get_db_session('member')
    
    try:
        # Get all payments
        payments = payment_session.query(Payment).all()
        print(f"DEBUG: Found {len(payments)} payments")
        
        # Get user map for names, phones, and ADDRESS
        users = member_session.query(User).all()
        print(f"DEBUG: Found {len(users)} users")
        user_map = {u.id: {'name': u.username, 'phone': u.phone_number, 'address': u.address} for u in users}
        
        # Transform payments into shipping format
        results = []
        for p in payments:
            # Default to User DB info
            user_data = user_map.get(p.user_id, {'name': "Unknown", 'phone': "N/A", 'address': "N/A"})
            
            # Try to extract more accurate info from order_info JSON
            order_phone = user_data['phone']
            order_address = user_data['address']
            
            if p.order_info:
                try:
                    order_json = json.loads(p.order_info)
                    
                    # Extract Phone
                    if 'checkout' in order_json and 'contact' in order_json['checkout']:
                        json_phone = order_json['checkout']['contact'].get('phone')
                        if json_phone:
                            order_phone = json_phone
                            
                    # Extract Address
                    if 'checkout' in order_json and 'billing' in order_json['checkout']:
                        billing = order_json['checkout']['billing']
                        # Construct address string
                        parts = [
                            billing.get('address'),
                            billing.get('city'),
                            billing.get('state'),
                            billing.get('zip'),
                            billing.get('country')
                        ]
                        # Filter out empty parts and join
                        valid_parts = [part for part in parts if part]
                        if valid_parts:
                            order_address = ", ".join(valid_parts)
                            
                except json.JSONDecodeError:
                    print(f"Error decoding JSON for payment {p.id}")
                except Exception as e:
                    print(f"Error parsing order info for payment {p.id}: {e}")

            results.append({
                "id": p.id,
                "order_id": p.id,  # Payment ID = Order ID
                "customer_name": user_data['name'],
                "phone_number": order_phone or "N/A",
                "address": order_address or "N/A",
                "status": "Delivered" if p.status == "completed" else "Pending" if p.status == "pending" else p.status, 
                "updated_at": p.timestamp,
                "amount": p.amount
            })
        
        print(f"DEBUG: Returning {len(results)} shipping records")
        return results
    except Exception as e:
        print(f"ERROR fetching shipping: {e}")
        import traceback
        traceback.print_exc()
        return []
    finally:
        payment_session.close()
        member_session.close()



@app.get("/admin/customers")
async def get_customers():
    """Fetch customers directly from member_db with payment stats from payment_db"""
    member_session = get_db_session('member')
    payment_session = get_db_session('payment')
    
    try:
        users = member_session.query(User).all()
        
        # Calculate payment stats
        payments = payment_session.query(Payment).all()
        user_stats = {}
        for p in payments:
            if p.user_id not in user_stats:
                user_stats[p.user_id] = {'spend': 0.0, 'orders': 0}
            user_stats[p.user_id]['spend'] += p.amount
            user_stats[p.user_id]['orders'] += 1

        results = []
        for user in users:
            stats = user_stats.get(user.id, {'spend': 0.0, 'orders': 0})
            
            results.append({
                "id": user.id,
                "user_id": user.id,
                "username": user.username,
                "full_name": user.full_name or user.username,  # Use full_name if available
                "email": user.email,
                "phone_number": user.phone_number or "N/A", # Use phone_number if available
                "vip_level": "Gold" if stats['spend'] > 500 else "Silver" if stats['spend'] > 200 else "Bronze" if stats['spend'] > 50 else "New",
                "status": user.status or "Active",
                "created_at": user.created_at,
                "total_spend": stats['spend'],
                "total_orders": stats['orders']
            })
        
        return results
    except Exception as e:
        print(f"Error serving customers: {e}")
        return []
    finally:
        member_session.close()
        payment_session.close()



@app.delete("/admin/customers/{user_id}")
async def delete_customer(user_id: int):
    member_session = get_db_session('member')
    payment_session = get_db_session('payment')
    try:
        user = member_session.query(User).filter(User.id == user_id).first()
        if not user:
             raise HTTPException(status_code=404, detail="User not found")
        
        # Manual Cascade: Delete payments for this user first
        # This prevents orphaned records and potential FK issues if they exist
        payments = payment_session.query(Payment).filter(Payment.user_id == user_id).all()
        for p in payments:
            payment_session.delete(p)
        payment_session.commit()

        member_session.delete(user)
        member_session.commit()
        return {"message": "Customer deleted successfully"}
    except Exception as e:
        member_session.rollback()
        payment_session.rollback()
        print(f"Delete Error: {e}") # Debug log
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        member_session.close()
        payment_session.close()

@app.delete("/admin/shipping/{order_id}")
async def delete_shipping_order(order_id: int):
    payment_session = get_db_session('payment')
    try:
        payment = payment_session.query(Payment).filter(Payment.id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Order not found")
        
        payment_session.delete(payment)
        payment_session.commit()
        return {"message": "Order deleted successfully"}
    except Exception as e:
        payment_session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        payment_session.close()

@app.put("/admin/shipping/{order_id}")
async def update_shipping_status_endpoint(order_id: int, request: ShippingUpdateRequest):
    session = get_db_session('payment')
    try:
        payment = session.query(Payment).filter(Payment.id == order_id).first()
        if not payment:
            raise HTTPException(status_code=404, detail="Order not found")
        
        payment.status = request.status
        # logic to map specific statuses if needed, e.g. "Shipped" might correspond to a specific internal state
        
        session.commit()
        return {"message": "Status updated successfully", "new_status": payment.status}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

# --- Warehouse Service ---
class WarehouseUpdateRequest(BaseModel):
    product_name: str
    quantity_change: int

@app.get("/admin/warehouse")
async def get_warehouse_inventory():
    session = get_db_session('admin')
    try:
        results = session.query(WarehouseInventory).all()
        return results
    finally:
        session.close()

@app.post("/admin/warehouse/update")
async def update_warehouse_inventory(request: WarehouseUpdateRequest):
    session = get_db_session('admin')
    try:
        item = session.query(WarehouseInventory).filter(WarehouseInventory.product_name == request.product_name).first()
        if not item:
            item = WarehouseInventory(product_name=request.product_name, quantity=0)
            session.add(item)
        
        item.quantity += request.quantity_change
        item.last_restock = datetime.utcnow()
        session.commit()
        return {
            "message": "Inventory updated", 
            "new_quantity": item.quantity,
            "last_restock": item.last_restock.isoformat() if item.last_restock else None
        }
    finally:
        session.close()

class InventoryCheckRequest(BaseModel):
    product_names: list[str]

@app.post("/api/inventory/check")
async def check_inventory(request: InventoryCheckRequest):
    """Check stock for a list of products. Returns map {name: quantity}"""
    session = get_db_session('admin')
    try:
        # Normalize names to lowercase for comparison if needed, or exact match
        # Using 'in_' clause for efficiency
        items = session.query(WarehouseInventory).filter(WarehouseInventory.product_name.in_(request.product_names)).all()
        
        stock_map = {item.product_name: item.quantity for item in items}
        
        # Ensure all requested items are in the map (default 0 if not found)
        # Note: If an item is not in the DB, we assume 0 stock to be safe, or logic can be inverted.
        # Here we return what we found. Frontend can decide default.
        result = {}
        for name in request.product_names:
            result[name] = stock_map.get(name, 0) # Default to 0 if not found
            
        return result
    except Exception as e:
        print(f"Inventory Check Error: {e}")
        return {} # Return empty on error to avoid breaking frontend
    finally:
        session.close()

@app.post("/analytics")
async def update_analytics(request: AnalyticsRequest):
    session = get_db_session('admin')
    try:
        # Check if cake entry exists
        cake_stat = session.query(CakeAnalytics).filter(CakeAnalytics.cake_name == request.cake_name).first()
        if cake_stat:
            cake_stat.quantity_sold += request.quantity
            cake_stat.last_updated = datetime.utcnow()
        else:
            cake_stat = CakeAnalytics(cake_name=request.cake_name, quantity_sold=request.quantity)
            session.add(cake_stat)
        
        session.commit()
        return {"message": "Analytics updated", "cake": cake_stat.cake_name, "total_sold": cake_stat.quantity_sold}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

class WorkshopRequest(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    course_name: str

@app.post("/workshop/register")
async def register_workshop(request: WorkshopRequest):
    session = get_db_session('member')
    try:
        new_reg = WorkshopRegistration(
            full_name=request.full_name,
            phone_number=request.phone_number,
            email=request.email,
            course_name=request.course_name
        )
        session.add(new_reg)
        session.commit()
        return {"message": "Workshop registration successful", "id": new_reg.id}
    except Exception as e:
        session.rollback()
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        session.close()

# --- AI Design Service ---
class DesignRequest(BaseModel):
    box_name: str
    items: list[str] = []

@app.post("/api/generate-design")
async def generate_design(request: DesignRequest):
    # Pollinations.ai does NOT require an API Token!
    # API_URL = "https://image.pollinations.ai/prompt/{prompt}"
    
    items_str = ", ".join(request.items) if request.items else "assorted premium cakes"
    # Prompt optimized for Pollinations
    prompt = f"product photography of a open {request.box_name} gift box filled with {items_str}, delicious, cinematic lighting, 8k, highly detailed, photorealistic"
    
    # URL Encode the prompt
    encoded_prompt = requests.utils.quote(prompt)
    API_URL = f"https://image.pollinations.ai/prompt/{encoded_prompt}?nologo=true"

    try:
        # Pollinations returns the image binary directly
        # Increased timeout to 60s as free APIs can be slow under load
        response = requests.get(API_URL, timeout=60)
        
        if response.status_code != 200:
            raise HTTPException(status_code=response.status_code, detail=f"Error from AI provider: {response.text}")

        image_bytes = response.content
        base64_image = base64.b64encode(image_bytes).decode('utf-8')
        return {"image": f"data:image/jpeg;base64,{base64_image}"}

    except Exception as e:
        print(f"Error generating image: {e}")
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)
