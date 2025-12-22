import requests
import time

BASE_URL = "http://localhost:8000"

def test_registration():
    print("\n--- Testing Registration (Member DB) ---")
    payload = {
        "username": "testuser_long_" + str(int(time.time())),
        "password": "a" * 80, # 80 characters, should be truncated to 72
        "email": f"test_long_{int(time.time())}@example.com"
    }
    try:
        response = requests.post(f"{BASE_URL}/register", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
        if response.status_code == 200:
            return True
    except Exception as e:
        print(f"Error: {e}")
    return False

def test_payment():
    print("\n--- Testing Payment (Payment DB) ---")
    payload = {
        "user_id": 1,
        "amount": 45.50,
        "order_info": "Chocolate Cake x1",
        "status": "completed"
    }
    try:
        response = requests.post(f"{BASE_URL}/payment", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_analytics():
    print("\n--- Testing Analytics (Admin DB) ---")
    payload = {
        "cake_name": "Chocolate Lava",
        "quantity": 2
    }
    try:
        response = requests.post(f"{BASE_URL}/analytics", json=payload)
        print(f"Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

def test_admin_expansion():
    print("\n--- Testing Admin Expansion (Shipping, Customer, Warehouse) ---")
    
    # 1. Shipping
    print("Testing Shipping...")
    ship_payload = {"user_id":1, "amount":0} # Mock payload for init
    try:
        resp = requests.post(f"{BASE_URL}/admin/shipping/init", json=ship_payload)
        if resp.status_code == 200:
            ship_id = resp.json().get('id')
            print(f"Initialized Shipping ID: {ship_id}")
            
            # Update status
            # Note: The init API mocks the order_id with timestamp, we need to fetch it or rely on the mock logic
            # For this test, let's fetch all and update the last one
            get_resp = requests.get(f"{BASE_URL}/admin/shipping")
            all_shipping = get_resp.json()
            if all_shipping:
                last_order_id = all_shipping[-1]['order_id']
                update_resp = requests.put(f"{BASE_URL}/admin/shipping/{last_order_id}", json={"status": "Shipped"})
                print(f"Update Status: {update_resp.status_code}")
        else:
            print(f"Shipping Init Failed: {resp.text}")
    except Exception as e:
        print(f"Shipping Error: {e}")

    # 2. Customer
    print("Testing Customer...")
    try:
        # Update user 1
        cust_payload = {"vip_level": "Gold", "status": "Active"}
        resp = requests.put(f"{BASE_URL}/admin/customers/1", json=cust_payload)
        print(f"Customer Update (User 1): {resp.status_code}")
        
        # Verify
        resp = requests.get(f"{BASE_URL}/admin/customers")
        print(f"Customer List: {len(resp.json())} items")
    except Exception as e:
        print(f"Customer Error: {e}")

    # 3. Warehouse
    print("Testing Warehouse...")
    try:
        wh_payload = {"product_name": "Flour", "quantity_change": 50}
        resp = requests.post(f"{BASE_URL}/admin/warehouse/update", json=wh_payload)
        print(f"Warehouse Update: {resp.json()}")
        
        resp = requests.get(f"{BASE_URL}/admin/warehouse")
        print(f"Warehouse Inventory: {resp.json()}")
    except Exception as e:
        print(f"Warehouse Error: {e}")

if __name__ == "__main__":
    if test_registration():
        test_payment()
        test_analytics()
        test_admin_expansion()
    else:
        print("Registration failed, skipping downstream tests.")
