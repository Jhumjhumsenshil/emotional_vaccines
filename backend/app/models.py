from sqlalchemy import Column, Integer, String
from app.db import Base # adjust import to match your database base

class User(Base):
    __tablename__ = "users" # Must be plural to match public.users

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(80), unique=True, nullable=False)
    name = Column(String(100), nullable=False)
    email = Column(String(120), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)