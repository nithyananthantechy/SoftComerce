import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add is_seller to clients
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_seller BOOLEAN DEFAULT FALSE;")
        print("Added is_seller to clients.")
    except Exception as e:
        print(f"Error adding is_seller: {e}")
        
    # 2. Create vendor_products table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS vendor_products (
            id SERIAL PRIMARY KEY,
            vendor_id INTEGER REFERENCES clients(id),
            name TEXT NOT NULL,
            tagline TEXT,
            description TEXT,
            features JSONB,
            currency TEXT DEFAULT 'USD',
            price TEXT,
            need_server BOOLEAN DEFAULT FALSE,
            payment_status TEXT DEFAULT 'unpaid' CHECK (payment_status IN ('unpaid', 'paid', 'overdue')),
            status TEXT DEFAULT 'pending_approval' CHECK (status IN ('pending_approval', 'live', 'rejected')),
            created_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("Created vendor_products table.")
    except Exception as e:
        print(f"Error creating vendor_products: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
