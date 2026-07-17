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
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT FALSE;")
        print("Added is_email_verified column to clients table.")
    except Exception as e:
        print(f"Error adding is_email_verified: {e}")

    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS is_phone_verified BOOLEAN DEFAULT FALSE;")
        print("Added is_phone_verified column to clients table.")
    except Exception as e:
        print(f"Error adding is_phone_verified: {e}")

    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS register_email_otp TEXT;")
        print("Added register_email_otp column to clients table.")
    except Exception as e:
        print(f"Error adding register_email_otp: {e}")

    try:
        cursor.execute("ALTER TABLE clients ADD COLUMN IF NOT EXISTS register_phone_otp TEXT;")
        print("Added register_phone_otp column to clients table.")
    except Exception as e:
        print(f"Error adding register_phone_otp: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
