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
        cursor.execute("UPDATE clients SET is_seller = false WHERE is_seller IS NULL;")
        print("Updated clients table: set is_seller = false where NULL.")
    except Exception as e:
        print(f"Error: {e}")

    cursor.close()
    conn.close()

if __name__ == "__main__":
    migrate()
