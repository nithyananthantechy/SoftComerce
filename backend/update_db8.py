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
        # Check if 'listing_fee' already exists
        cursor.execute("SELECT id FROM service_pricings WHERE service_key = 'listing_fee';")
        row = cursor.fetchone()
        
        if not row:
            cursor.execute("""
                INSERT INTO service_pricings (service_key, service_name, price, currency, pricing_model, description)
                VALUES ('listing_fee', 'Marketplace Listing Fee', 99.00, 'USD', 'one_time', 'Standard platform fee for reviewing, verifying, and hosting product listing.');
            """)
            print("Successfully inserted default Marketplace Listing Fee service.")
        else:
            print("Marketplace Listing Fee service already exists.")
            
    except Exception as e:
        print(f"Error seeding listing fee service: {e}")
        
    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
