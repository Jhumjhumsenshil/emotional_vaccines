from fastapi import FastAPI, Depends, HTTPException, status
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session
from werkzeug.security import generate_password_hash,check_password_hash
from app.db import get_db
from app.models import User

app = FastAPI(title="Video Portal API")

# Pydantic schema for incoming request payload
class RegisterSchema(BaseModel):
    name: str
    username: str
    email: EmailStr
    password: str
    

@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: RegisterSchema, db: Session = Depends(get_db)):
    # 1. Check if email or username already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == user_data.username)
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username or Email already exists."
        )

    # 2. Hash password using scrypt (matching your existing DB hashes)
    hashed_pwd = generate_password_hash(user_data.password, method="scrypt")

    # 3. Create new user instance
    new_user = User(
        name=user_data.name,
        username=user_data.username,
        email=user_data.email,
        password_hash=hashed_pwd
    )

    # 4. Save to database
    try:
        db.add(new_user)
        db.commit()
        db.refresh(new_user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error: {str(e)}"
        )

    return {"message": "User registered successfully", "id": new_user.id}

class LoginSchema(BaseModel):
    username: str  # Accepts either username or email
    password: str


@app.post("/api/auth/login")
def login_user(credentials: LoginSchema, db: Session = Depends(get_db)):
    # 1. Fetch user by username OR email
    user = db.query(User).filter(
        (User.username == credentials.username) | (User.email == credentials.username)
    ).first()

    # 2. Validate user presence and verify password hash
    if not user or not check_password_hash(user.password_hash, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # 3. Return user session data
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email
        }
    }