import psycopg2

DB_CONFIG = {
    "host": "localhost",
    "port": 5432,
    "database": "emotionalvaccines",
    "user": "postgres",
    "password": "postgres123",
}

with open("migrations/V1__init_rbac_schema.sql", "r") as file:
    sql = file.read()

connection = psycopg2.connect(**DB_CONFIG)

try:
    with connection.cursor() as cursor:
        cursor.execute(sql)

    connection.commit()
    print("Migration completed successfully.")

except Exception as e:
    connection.rollback()
    print("Migration failed:", e)

finally:
    connection.close()