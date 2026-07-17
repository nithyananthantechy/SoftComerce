import os
from dotenv import load_dotenv
import psycopg2

load_dotenv()
DATABASE_URL = os.getenv("DATABASE_URL")

def migrate():
    conn = psycopg2.connect(DATABASE_URL)
    conn.autocommit = True
    cursor = conn.cursor()
    
    # 1. Add pricing_model and description columns to service_pricings
    try:
        cursor.execute("ALTER TABLE service_pricings ADD COLUMN IF NOT EXISTS pricing_model TEXT DEFAULT 'one_time';")
        print("Added pricing_model column to service_pricings.")
    except Exception as e:
        print(f"Error adding pricing_model: {e}")

    try:
        cursor.execute("ALTER TABLE service_pricings ADD COLUMN IF NOT EXISTS description TEXT;")
        print("Added description column to service_pricings.")
    except Exception as e:
        print(f"Error adding description: {e}")

    # 2. Update default service items with proper models and descriptions
    default_services = [
        ("server_setup", "Deployment Server Setup", 99.00, "USD", "one_time", "Request deployment server setup managed by NITECHSPARK."),
        ("support_bot", "Customer Support Bot or Team", 150.00, "USD", "per_month", "Include AI Support Bot and client ticketing routing system."),
        ("cloud_management", "Cloud Management", 199.00, "USD", "per_month", "Complete multi-cloud hosting resource monitoring & audit tools."),
        ("tech_support", "Tech Support", 99.00, "USD", "per_month", "Dedicated technical assistance and code integration debugging support."),
        ("it_support", "IT Support", 120.00, "USD", "per_month", "Standard IT helpdesk ticketing management workflows."),
    ]

    for key, name, price, currency, model, desc in default_services:
        try:
            cursor.execute("""
            UPDATE service_pricings 
            SET service_name = %s,
                price = %s,
                currency = %s,
                pricing_model = %s,
                description = %s
            WHERE service_key = %s;
            """, (name, price, currency, model, desc, key))
            print(f"Updated default details for service {key}.")
        except Exception as e:
            print(f"Error updating service {key}: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
