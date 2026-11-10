import requests

BASE_URL = "http://127.0.0.1:8000"

print("--- 1. Testing login of pending user (john_doe) ---")
res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "john_doe", "password": "user123"}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 403
assert res.json()["detail"] == "Your account is waiting for Super Admin approval."

print("\n--- 2. Testing login of admin ---")
res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "admin", "password": "admin123"}, timeout=5)
print(f"Status: {res.status_code}, User: {res.json()['user']}")
assert res.status_code == 200

print("\n--- 3. Testing listing users ---")
res = requests.get(f"{BASE_URL}/api/admin/users", timeout=5)
users = res.json()
print(f"Status: {res.status_code}, Total users: {len(users)}")
john = next((u for u in users if u["username"] == "john_doe"), None)
print(f"john_doe current status: {john['status']}, role: {john['role']}")

print("\n--- 4. Approving john_doe by assigning role 'Content Manager' ---")
res = requests.post(f"{BASE_URL}/api/admin/users/{john['id']}/role", json={"role_name": "Content Manager"}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200

print("\n--- 5. Testing login of now-approved john_doe ---")
res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "john_doe", "password": "user123"}, timeout=5)
print(f"Status: {res.status_code}, User: {res.json()['user']}")
assert res.status_code == 200
assert res.json()["user"]["role"] == "Content Manager"

print("\n--- 6. Deactivating john_doe ---")
res = requests.post(f"{BASE_URL}/api/admin/users/{john['id']}/status", json={"is_active": False}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200

print("\n--- 7. Testing login of deactivated user ---")
res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": "john_doe", "password": "user123"}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 403
assert "deactivated" in res.json()["detail"].lower()

print("\n--- 8. Reactivating john_doe ---")
res = requests.post(f"{BASE_URL}/api/admin/users/{john['id']}/status", json={"is_active": True}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 200

print("\n--- 9. Testing register new user ---")
import time
unique_email = f"test_{int(time.time())}@example.com"
res = requests.post(f"{BASE_URL}/api/auth/register", json={
    "name": "Sarah Connor",
    "email": unique_email,
    "password": "sarahpassword123"
}, timeout=5)
print(f"Register status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 201
assert res.json()["status"] == "pending"

print("\n--- 10. Testing login of newly registered pending user ---")
res = requests.post(f"{BASE_URL}/api/auth/login", json={"username": unique_email, "password": "sarahpassword123"}, timeout=5)
print(f"Status: {res.status_code}, Response: {res.json()}")
assert res.status_code == 403
assert res.json()["detail"] == "Your account is waiting for Super Admin approval."

print("\n>>> ALL 10 TESTS PASSED SUCCESSFULLY! <<<")
