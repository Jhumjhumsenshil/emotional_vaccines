import sys
import traceback
from fastapi.testclient import TestClient

sys.path.insert(0, ".")

try:
    from app.main import app
    client = TestClient(app)
    
    print("Testing GET /api/admin/users...")
    res = client.get("/api/admin/users")
    print("Status:", res.status_code)
    print("Data:", res.json())
except Exception as e:
    print("Exception occurred:")
    traceback.print_exc()
