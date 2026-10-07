import os
from typing import Optional
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, EmailStr
from sqlalchemy.orm import Session, joinedload
from werkzeug.security import generate_password_hash, check_password_hash

from app.db import get_db
from app.models import User, Role
from app import models,schemas


app = FastAPI(title="Video Portal & EmotionalVaccine API")

# Enable CORS for frontend interactions
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/api/health")
@app.get("/health")
def health_check():
    return {"status": "ok", "message": "FastAPI is running"}


# ----------------------------------------------------
# Pydantic Schemas
# ----------------------------------------------------
class RegisterSchema(BaseModel):
    name: str
    email: EmailStr
    password: str
    username: Optional[str] = None


class LoginSchema(BaseModel):
    username: str  # Accepts either username or email
    password: str


class RoleAssignSchema(BaseModel):
    role_name: str


class StatusUpdateSchema(BaseModel):
    is_active: Optional[bool] = None
    status: Optional[str] = None


# ----------------------------------------------------
# Auth Endpoints
# ----------------------------------------------------
@app.post("/api/auth/register", status_code=status.HTTP_201_CREATED)
def register_user(user_data: RegisterSchema, db: Session = Depends(get_db)):
    # Generate username from email if not explicitly provided
    desired_username = user_data.username.strip() if user_data.username and user_data.username.strip() else user_data.email.split("@")[0]

    # 1. Check if email or username already exists
    existing_user = db.query(User).filter(
        (User.email == user_data.email) | (User.username == desired_username)
    ).first()

    if existing_user:
        if existing_user.email == user_data.email:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="An account with this email address already exists."
            )
        else:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="This username is already taken. Please choose another."
            )

    # 2. Hash password using scrypt
    hashed_pwd = generate_password_hash(user_data.password, method="scrypt")

    # 3. Create new user instance with status "pending", is_active True, NO role assigned
    new_user = User(
        name=user_data.name.strip(),
        username=desired_username,
        email=user_data.email.strip().lower(),
        password_hash=hashed_pwd,
        status="pending",
        is_active=True,
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

    return {
        "message": "Registration successful! Your account is waiting for Super Admin approval.",
        "status": "pending",
        "user": {
            "id": new_user.id,
            "name": new_user.name,
            "username": new_user.username,
            "email": new_user.email,
            "status": new_user.status,
            "is_active": new_user.is_active,
            "role": None
        }
    }


@app.post("/api/auth/login")
def login_user(credentials: LoginSchema, db: Session = Depends(get_db)):
    login_identifier = credentials.username.strip()

    # 1. Fetch user by username OR email (with roles eagerly loaded)
    user = db.query(User).options(joinedload(User.roles)).filter(
        (User.username == login_identifier) | (User.email == login_identifier.lower())
    ).first()

    # 2. Validate user presence and verify password hash
    if not user or not check_password_hash(user.password_hash, credentials.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid username/email or password."
        )

    # 3. Check if user is deactivated
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account has been deactivated by the Administrator."
        )

    # 4. Check approval status / role assignment
    # Users with status 'pending' or without any role cannot log in yet
    user_role = user.roles[0].name if user.roles else None
    if user.status == "pending" or not user_role:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Your account is waiting for Super Admin approval."
        )

    # 5. Return user session data
    return {
        "message": "Login successful",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "role": user_role,
            "status": user.status,
            "is_active": user.is_active
        }
    }


# ----------------------------------------------------
# Roles & Admin User Management Endpoints
# ----------------------------------------------------
@app.get("/api/roles")
def get_roles(db: Session = Depends(get_db)):
    roles = db.query(Role).all()
    return [
        {
            "id": r.id,
            "name": r.name,
            "description": r.description
        }
        for r in roles
    ]


@app.get("/api/admin/users")
def get_all_users(db: Session = Depends(get_db)):
    users = db.query(User).options(joinedload(User.roles)).order_by(User.id.desc()).all()
    user_list = []
    for u in users:
        role_name = u.roles[0].name if u.roles else None
        role_id = u.roles[0].id if u.roles else None
        user_list.append({
            "id": u.id,
            "name": u.name,
            "username": u.username,
            "email": u.email,
            "status": u.status,
            "is_active": u.is_active,
            "role": role_name,
            "role_id": role_id,
            "created_at": u.created_at.isoformat() if u.created_at else None
        })
    return user_list



@app.post("/api/admin/users/{user_id}/role")
def assign_user_role(user_id: int, payload: RoleAssignSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    role = db.query(Role).filter(Role.name == payload.role_name).first()
    if not role:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Role '{payload.role_name}' does not exist."
        )

    # Assign role and approve user
    user.roles = [role]
    user.status = "approved"

    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user role: {str(e)}"
        )

    return {
        "message": f"Assigned role '{role.name}' and approved {user.name}.",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "status": user.status,
            "is_active": user.is_active,
            "role": role.name
        }
    }


@app.post("/api/admin/users/{user_id}/status")
def toggle_user_status(user_id: int, payload: StatusUpdateSchema, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if payload.is_active is not None:
        user.is_active = payload.is_active

    if payload.status is not None:
        user.status = payload.status

    try:
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to update user status: {str(e)}"
        )

    action_text = "activated" if user.is_active else "deactivated"
    return {
        "message": f"User {user.name} has been {action_text}.",
        "user": {
            "id": user.id,
            "name": user.name,
            "username": user.username,
            "email": user.email,
            "status": user.status,
            "is_active": user.is_active,
            "role": user.roles[0].name if user.roles else None
        }
    }


@app.delete("/api/admin/users/{user_id}")
def delete_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found."
        )

    if user.username == "admin":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="The root Administrator account cannot be deleted."
        )

    try:
        db.delete(user)
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete user: {str(e)}"
        )

    return {"message": f"User {user.name} ({user.username}) was deleted."}

@app.get("/api/roles", response_model=list[schemas.RoleOut])
def get_all_roles(db: Session = Depends(get_db)):
    return db.query(models.Role).all()
