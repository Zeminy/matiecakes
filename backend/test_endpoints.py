import requests
import time

def test_endpoints():
    base_url = "http://localhost:8000"
    
    # Wait for server to potentially restart? (We assume it's running when we run this)
    
    print("Testing /admin/shipping...")
    try:
        r = requests.get(f"{base_url}/admin/shipping")
        if r.status_code == 200:
            print(f"SUCCESS: /admin/shipping returned {len(r.json())} items")
        else:
            print(f"FAIL: /admin/shipping returned {r.status_code} - {r.text}")
    except Exception as e:
        print(f"FAIL: Could not connect to /admin/shipping: {e}")

    print("\nTesting /admin/customers...")
    try:
        r = requests.get(f"{base_url}/admin/customers")
        if r.status_code == 200:
            print(f"SUCCESS: /admin/customers returned {len(r.json())} items")
            data = r.json()
            if data and 'total_spend' in data[0]:
                 print("    Verified 'total_spend' field exists.")
            else:
                 print("    WARNING: 'total_spend' field missing!")
        else:
            print(f"FAIL: /admin/customers returned {r.status_code} - {r.text}")
    except Exception as e:
        print(f"FAIL: Could not connect to /admin/customers: {e}")

if __name__ == "__main__":
    test_endpoints()
