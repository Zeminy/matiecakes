"""
Migration script: Align PostgreSQL schema with models.py v2.0
Fixes:
  1. workshop_registrations - drop old columns, add new ones
  2. payments - add order_id FK, drop order_info
  3. cake_analytics - rename cake_name -> product_name
"""
import sys
sys.path.insert(0, r'd:\Dev\Workspace_code\ISM\matiecakes\backend')

from db_utils import get_db_engine
from sqlalchemy import text

def migrate_member_db():
    print("\n--- Migrating MEMBER_DB ---")
    eng = get_db_engine('member')
    with eng.connect() as conn:
        # Add new columns if missing
        migrations = [
            "ALTER TABLE workshop_registrations ADD COLUMN IF NOT EXISTS user_id INTEGER",
            "ALTER TABLE workshop_registrations ADD COLUMN IF NOT EXISTS guest_name VARCHAR(100)",
            "ALTER TABLE workshop_registrations ADD COLUMN IF NOT EXISTS guest_phone VARCHAR(20)",
            "ALTER TABLE workshop_registrations ADD COLUMN IF NOT EXISTS guest_email VARCHAR(100)",
        ]
        # Copy old data to guest fallback fields before dropping
        copy_migrations = [
            "UPDATE workshop_registrations SET guest_name = full_name WHERE guest_name IS NULL AND full_name IS NOT NULL",
            "UPDATE workshop_registrations SET guest_phone = phone_number WHERE guest_phone IS NULL AND phone_number IS NOT NULL",
            "UPDATE workshop_registrations SET guest_email = email WHERE guest_email IS NULL AND email IS NOT NULL",
        ]
        # Drop old columns
        drop_migrations = [
            "ALTER TABLE workshop_registrations DROP COLUMN IF EXISTS full_name",
            "ALTER TABLE workshop_registrations DROP COLUMN IF EXISTS phone_number",
            "ALTER TABLE workshop_registrations DROP COLUMN IF EXISTS email",
        ]
        for sql in migrations + copy_migrations + drop_migrations:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql[:70]}")
            except Exception as e:
                print(f"  SKIP: {sql[:70]} -> {e}")
        conn.commit()
    print("  MEMBER_DB migration complete.")

def migrate_payment_db():
    print("\n--- Migrating PAYMENT_DB ---")
    eng = get_db_engine('payment')
    with eng.connect() as conn:
        migrations = [
            # Add order_id column if missing (no FK constraint since orders table exists in same DB)
            "ALTER TABLE payments ADD COLUMN IF NOT EXISTS order_id INTEGER",
            # Drop old order_info column
            "ALTER TABLE payments DROP COLUMN IF EXISTS order_info",
        ]
        for sql in migrations:
            try:
                conn.execute(text(sql))
                print(f"  OK: {sql[:70]}")
            except Exception as e:
                print(f"  SKIP: {sql[:70]} -> {e}")
        conn.commit()
    print("  PAYMENT_DB migration complete.")

def migrate_admin_db():
    print("\n--- Migrating ADMIN_DB ---")
    eng = get_db_engine('admin')
    with eng.connect() as conn:
        # Rename cake_name -> product_name on cake_analytics
        try:
            conn.execute(text("ALTER TABLE cake_analytics RENAME COLUMN cake_name TO product_name"))
            print("  OK: Renamed cake_analytics.cake_name -> product_name")
        except Exception as e:
            print(f"  SKIP: Rename cake_name -> probably already done: {e}")
        conn.commit()
    print("  ADMIN_DB migration complete.")

if __name__ == "__main__":
    migrate_member_db()
    migrate_payment_db()
    migrate_admin_db()
    print("\n✅ All migrations complete.")
