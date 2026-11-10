import uuid
from fastapi import APIRouter, Depends, HTTPException, status, BackgroundTasks
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas
from app.utils.email import send_champion_email

router = APIRouter(prefix="/api/customers", tags=["Customers"])

@router.get("", response_model=List[schemas.CustomerResponse])
def get_customers(db: Session = Depends(get_db)):
    customers = db.query(models.CustomerModel).all()
    return customers

@router.post("", response_model=schemas.CustomerResponse, status_code=status.HTTP_201_CREATED)
def create_customer(
    payload: schemas.CustomerCreate, 
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)):
    # 1. Check if email already exists
    existing_customer = db.query(models.CustomerModel).filter(models.CustomerModel.email == payload.email).first()
    if existing_customer:
        raise HTTPException(status_code=400, detail="A customer with this email already exists.")

    # 2. If organization_id is provided, verify it exists
    if payload.organization_id:
        org = db.query(models.OrganizationModel).filter(models.OrganizationModel.id == payload.organization_id).first()
        if not org:
            raise HTTPException(status_code=404, detail="Selected organization not found.")

    # 3. Create customer instance with auto-generated unique tokens
    db_customer = models.CustomerModel(
        name=payload.name,       
        email=payload.email,
        phone=payload.phone,        
        org_id=payload.organization_id,
        customer_type=payload.customer_type,
        is_active=payload.is_active,
        video_access=payload.video_access,
        notes=payload.notes,
        
        # Auto-generated secure tokens for dynamic links
        consumer_token=str(uuid.uuid4()),
        champion_token=str(uuid.uuid4())
    )

    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)

    # 3. Schedule email to send in the background
    background_tasks.add_task(
        send_champion_email, 
        customer_email=db_customer.email, 
        customer_name=db_customer.name, 
        champion_token=db_customer.champion_token
    )

    return db_customer

@router.put("/{customer_id}", response_model=schemas.CustomerResponse)
def update_customer(customer_id: int, payload: schemas.CustomerCreate, db: Session = Depends(get_db)):
    # Find existing customer
    db_customer = db.query(models.CustomerModel).filter(models.CustomerModel.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found.")

    # Check if email is being changed to one that already exists for another user
    if payload.email != db_customer.email:
        email_exists = db.query(models.CustomerModel).filter(models.CustomerModel.email == payload.email).first()
        if email_exists:
            raise HTTPException(status_code=400, detail="A customer with this email already exists.")

    # Update fields
    db_customer.name = payload.name
    db_customer.email = payload.email
    db_customer.phone = payload.phone
    db_customer.customer_type = payload.customer_type
    db_customer.org_id = payload.organization_id
    db_customer.is_active = payload.is_active
    db_customer.video_access = payload.video_access
    db_customer.notes = payload.notes

    db.commit()
    db.refresh(db_customer)

    return db_customer