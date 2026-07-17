import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    try:
        cursor.execute("ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'per_month';")
        print("Added pricing_model to vendor_products.")
    except Exception as e:
        print(f"Error: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
