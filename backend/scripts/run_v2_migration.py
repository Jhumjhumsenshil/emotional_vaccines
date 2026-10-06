import psycopg2
import os
from dotenv import load_dotenv

load_dotenv()

conn = psycopg2.connect(
    dbname=os.getenv('DB_NAME'),
    user=os.getenv('DB_USER'),
    password=os.getenv('DB_PASSWORD'),
    host=os.getenv('DB_HOST', 'localhost'),
    port=os.getenv('DB_PORT', '5432')
)

try:
    with open("migrations/V2__add_status_and_roles.sql", "r") as file:
        sql = file.read()
    
    with conn.cursor() as cursor:
        cursor.execute(sql)
    
    conn.commit()
    print("V2 Migration applied successfully!")
except Exception as e:
    conn.rollback()
    print("Migration failed:", e)
finally:
    conn.close()
