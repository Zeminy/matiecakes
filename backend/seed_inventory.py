import os
import re
import random
from sqlalchemy.orm import Session
from db_utils import get_db_session
from models import WarehouseInventory

def scan_html_files(directory):
    product_names = set()
    
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".html"):
                filepath = os.path.join(root, file)
                
                if 'node_modules' in filepath or '.git' in filepath:
                    continue

                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                matches = re.findall(r'<div class="product-name">\s*(.*?)\s*</div>', content, re.DOTALL)
                matches_box = re.findall(r'<div class="box-option-name">\s*(.*?)\s*</div>', content, re.DOTALL)
                
                for name in matches + matches_box:
                    clean_name = name.strip()
                    if clean_name and "Matie Cake" not in clean_name: # Avoid generic titles if any
                        product_names.add(clean_name)

    return list(product_names)

def scan_js_files(directory):
    product_names = set()
    for root, dirs, files in os.walk(directory):
        for file in files:
            if file.endswith(".js"):
                filepath = os.path.join(root, file)
                if 'node_modules' in filepath or '.git' in filepath:
                    continue
                with open(filepath, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                matches = re.findall(r"name:\s*'(.*?)'", content)
                for name in matches:
                    clean_name = name.strip()
                    if clean_name and "Matie Cake" not in clean_name:
                        product_names.add(clean_name)
    return list(product_names)

def seed_inventory():
    print("Scanning for products...")
    # Assume script is run from project root, so scan current dir
    products_html = scan_html_files("..")
    products_js = scan_js_files("..")
    products = list(set(products_html + products_js))
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
                safe_name = name.encode('ascii', 'ignore').decode('ascii')
                print(f"Added: {safe_name} (Qty: {qty})")
            else:
                safe_name = name.encode('ascii', 'ignore').decode('ascii')
                print(f"Skipped (Exists): {safe_name}")
        
        session.commit()
        print(f"Seeding complete. Added {added_count} new items.")
        
    except Exception as e:
        session.rollback()
        print("Error seeding inventory:")
        print(str(e).encode('utf-8', 'ignore').decode('utf-8'))
    finally:
        session.close()

if __name__ == "__main__":
    seed_inventory()
