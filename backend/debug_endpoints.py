import requests

# Test the admin endpoints with detailed error handling
base_url = "http://localhost:8000"

print("=" * 50)
print("Testing Admin Endpoints")
print("=" * 50)

# Test shipping
print("\n1. Testing /admin/shipping...")
try:
    r = requests.get(f"{base_url}/admin/shipping", timeout=5)
    print(f"   Status Code: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Response Type: {type(data)}")
        print(f"   Items Count: {len(data) if isinstance(data, list) else 'not a list'}")
        if data:
            print(f"   Sample Item: {data[0]}")
        else:
            print("   Response is empty list")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

# Test customers
print("\n2. Testing /admin/customers...")
try:
    r = requests.get(f"{base_url}/admin/customers", timeout=5)
    print(f"   Status Code: {r.status_code}")
    if r.status_code == 200:
        data = r.json()
        print(f"   Response Type: {type(data)}")
        print(f"   Items Count: {len(data) if isinstance(data, list) else 'not a list'}")
        if data:
            print(f"   Sample Item: {data[0]}")
        else:
            print("   Response is empty list")
    else:
        print(f"   Error: {r.text}")
except Exception as e:
    print(f"   Exception: {e}")

print("\n" + "=" * 50)
