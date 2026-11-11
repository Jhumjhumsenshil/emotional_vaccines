import psycopg

DATABASE_URL = "postgresql://neondb_owner:npg_rpES5YhGTu6P@ep-weathered-river-zasneefq-pooler.c-2.eu-west-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require"
sql_file = r"C:\Users\jsenshil\Downloads\full_backup.sql"



print("Restoring database to Neon...")
try:
    with psycopg.connect(DATABASE_URL) as conn:
        with conn.cursor() as cur:
            with open(sql_file, "r", encoding="utf-8", errors="replace") as f:
                cur.execute(f.read())
            conn.commit()
    print("Database backup restored successfully!")
except Exception as e:
    print(f"Error restoring database: {e}")