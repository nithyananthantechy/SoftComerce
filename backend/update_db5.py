import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add bank_details to clients
    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS bank_details JSONB DEFAULT '{}'::jsonb;")
        print("Added bank_details to clients.")
    except Exception as e:
        print(f"Error adding bank_details: {e}")

    # 2. Create marketplace_purchases table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS marketplace_purchases (
            id SERIAL PRIMARY KEY,
            product_id INTEGER REFERENCES vendor_products(id),
            buyer_id INTEGER REFERENCES clients(id),
            buyer_name TEXT NOT NULL,
            buyer_email TEXT NOT NULL,
            shipping_address TEXT NOT NULL,
            amount NUMERIC NOT NULL,
            payment_id TEXT,
            status TEXT DEFAULT 'completed' CHECK (status IN ('pending', 'completed', 'failed')),
            created_at TIMESTAMP DEFAULT NOW()
        );
        """)
        print("Created marketplace_purchases table.")
    except Exception as e:
        print(f"Error creating marketplace_purchases: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
