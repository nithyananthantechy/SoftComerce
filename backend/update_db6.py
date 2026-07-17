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
        cursor.execute("ALTER TABLE vendor_products ADD COLUMN IF NOT EXISTS demo_video_url TEXT;")
        print("Added demo_video_url column to vendor_products table.")
    except Exception as e:
        print(f"Error adding demo_video_url: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
