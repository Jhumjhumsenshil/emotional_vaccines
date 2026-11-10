import psycopg2
from werkzeug.security import generate_password_hash
from app.config import Config

# Demo Users Data: (username, email, plain_password, role_name)
DEMO_USERS = [
    ('admin', 'Test Admin','admin@example.com', 'admin123', 'Super Admin'),
    ('manager', 'Test Manager' ,'manager@example.com', 'manager123', 'Manager'),
    ('john_doe', 'John','john@example.com', 'user123', None)  # Regular user with no special role
]

def seed_users():
    print("[SEED] Seeding demo users into PostgreSQL...")
    conn = None
    try:
        conn = psycopg2.connect(
            dbname=Config.DB_NAME,
            user=Config.DB_USER,
            password=Config.DB_PASSWORD,
            host=Config.DB_HOST,
            port=Config.DB_PORT
        )
        cursor = conn.cursor()

        for username, name, email, raw_password, role_name in DEMO_USERS:
            # Hash password using Werkzeug
            hashed_pw = generate_password_hash(raw_password)

            user_status = "approved" if role_name else "pending"

            # 1. Insert user if username doesn't exist
            cursor.execute("""
                INSERT INTO users (username, name, email, password_hash, status, is_active)
                VALUES (%s, %s, %s, %s, %s, true)
                ON CONFLICT (username) DO UPDATE 
                SET status = EXCLUDED.status, name = EXCLUDED.name, email = EXCLUDED.email
                RETURNING id;
            """, (username, name, email, hashed_pw, user_status))
            
            result = cursor.fetchone()

            # Fetch user ID (either newly inserted or existing)
            if result:
                user_id = result[0]
            else:
                cursor.execute("SELECT id FROM users WHERE username = %s;", (username,))
                user_id = cursor.fetchone()[0]

            # 2. Assign Role in user_roles table if role_name is provided
            if role_name:
                cursor.execute("SELECT id FROM roles WHERE name = %s;", (role_name,))
                role = cursor.fetchone()
                
                if role:
                    role_id = role[0]
                    cursor.execute("""
                        INSERT INTO user_roles (user_id, role_id)
                        VALUES (%s, %s)
                        ON CONFLICT (user_id, role_id) DO NOTHING;
                    """, (user_id, role_id))

            print(f"[OK] Processed user: {username} ({role_name if role_name else 'No Role'} - {user_status})")


        conn.commit()
        cursor.close()
        print("[SUCCESS] Demo users seeded successfully!")

    except Exception as e:
        if conn:
            conn.rollback()
        print(f"[ERROR] Failed to seed users: {e}")

    finally:
        if conn:
            conn.close()

if __name__ == '__main__':
    seed_users()