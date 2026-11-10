# import psycopg2
# from app.config import Config

# def get_db_connection():
#     return psycopg2.connect(
#         dbname=Config.DB_NAME,
#         user=Config.DB_USER,
#         password=Config.DB_PASSWORD,
#         host=Config.DB_HOST,
#         port=Config.DB_PORT
#     )



# from sqlalchemy import create_engine
# from sqlalchemy.orm import sessionmaker, declarative_base

# DATABASE_URL = "postgresql://postgres:postgres123@localhost:5432/postgres"

# engine = create_engine(DATABASE_URL)
# SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Base = declarative_base()

# # Ensure this function name matches what you import in main.py
# def get_db():
#     db = SessionLocal()
#     try:
#         yield db
#     finally:
#         db.close()


import os

from dotenv import load_dotenv
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base

load_dotenv()

DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASSWORD = os.getenv("DB_PASSWORD")
DB_HOST = os.getenv("DB_HOST", "localhost")
DB_PORT = os.getenv("DB_PORT", "5432")

DATABASE_URL = (
    f"postgresql://{DB_USER}:{DB_PASSWORD}"
    f"@{DB_HOST}:{DB_PORT}/{DB_NAME}"
)

engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()