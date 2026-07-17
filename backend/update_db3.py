import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add version and selected_services to vendor_products
    try:
        cursor.execute("ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';")
        print("Added version to vendor_products.")
    except Exception as e:
        print(f"Error adding version: {e}")

    try:
        cursor.execute("ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS selected_services JSONB DEFAULT '{}'::jsonb;")
        print("Added selected_services to vendor_products.")
    except Exception as e:
        print(f"Error adding selected_services: {e}")
        
    # 2. Create service_pricings table
    try:
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS service_pricings (
            id SERIAL PRIMARY KEY,
            service_key TEXT UNIQUE NOT NULL,
            service_name TEXT NOT NULL,
            price NUMERIC NOT NULL DEFAULT 0,
            currency TEXT DEFAULT 'USD'
        );
        """)
        print("Created service_pricings table.")
    except Exception as e:
        print(f"Error creating service_pricings: {e}")

    # 3. Populate default service prices
    default_services = [
        ("server_setup", "Deployment Server Setup", 99.00, "USD"),
        ("support_bot", "Customer Support Bot or Team", 150.00, "USD"),
        ("cloud_management", "Cloud Management", 199.00, "USD"),
        ("tech_support", "Tech Support", 99.00, "USD"),
        ("it_support", "IT Support", 120.00, "USD"),
    ]

    for key, name, price, currency in default_services:
        try:
            cursor.execute("""
            INSERT INTO service_pricings (service_key, service_name, price, currency)
            VALUES (%s, %s, %s, %s)
            ON CONFLICT (service_key) DO UPDATE 
            SET service_name = EXCLUDED.service_name, 
                price = EXCLUDED.price, 
                currency = EXCLUDED.currency;
            """, (key, name, price, currency))
            print(f"Populated/updated service pricing for {key}.")
        except Exception as e:
            print(f"Error inserting default service {key}: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
