import os
import re
import random
from sqlalchemy.orm import Session
from db_utils import get_db_session
from models import WarehouseInventory

def scan_html_files(directory):
    product_names = set()
    
    # We will look for product name patterns.
    # Pattern 1: <div class="product-name">Name</div>
    # Pattern 2: <h1 class="product-title">Name</h1> (in product detail pages)
    # Pattern 3: <title>Name | Matie Cake</title>
    
    # Simplest regex for the common card pattern in this project:
    # <div class="product-name">Name</div>
    # Note: The HTML might have newlines or spaces.
    
    # Let's iterate files.
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                
                if 'node_modules' in filepath or '.git' in filepath:
                    continue

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Regex to find content inside <div class="product-name">...</div>
                # flags=re.DOTALL to handle multiline, although usually short.
                matches = re.findall(r'<div class="product-name">\s*(.*?)\s*</div>', content, re.DOTALL)
                
                for name in matches:
                    clean_name = name.strip()
                    if clean_name and "Matie Cake" not in clean_name: # Avoid generic titles if any
                        product_names.add(clean_name)

    return list(product_names)

def seed_inventory():
    print("Scanning for products...")
    # Assume script is run from project root, so scan current dir
    products = scan_html_files(".")
    print(f"Found {len(products)} unique products.")
    
    session = get_db_session('admin')
    
    added_count = 0
    
    try:
        for name in products:
            # Check if exists
            exists = session.query(WarehouseInventory).filter(WarehouseInventory.product_name == name).first()
            if not exists:
                # Create with dummy quantity
                qty = random.randint(10, 100)
                new_item = WarehouseInventory(product_name=name, quantity=qty)
                session.add(new_item)
                added_count += 1
                print(f"Added: {name} (Qty: {qty})")
            else:
                print(f"Skipped (Exists): {name}")
        
        session.commit()
        print(f"Seeding complete. Added {added_count} new items.")
        
    except Exception as e:
        session.rollback()
        print(f"Error seeding inventory: {e}")
    finally:
        session.close()

if __name__ == "__main__":
    seed_inventory()
