from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

# Import your database session, models, and schemas here
# from database import get_db
# import models, schemas

from app.db import get_db
from app.models import User, Role, Permission
from app import models, schemas

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

# 1. Get All Organizations
@router.get("", response_model=List[schemas.OrganizationResponse])
def get_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orgs = db.query(models.OrganizationModel).offset(skip).limit(limit).all()
    return orgs

# 2. Create an Organization
@router.post("", response_model=schemas.OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(org: schemas.OrganizationCreate, db: Session = Depends(get_db)):
    # Check for duplicate slug
    existing = db.query(models.OrganizationModel).filter(models.OrganizationModel.slug == org.slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Slug '{org.slug}' is already in use.")
    
    db_org = models.OrganizationModel(**org.dict())
    db.add(db_org)
    db.commit()
    db.refresh(db_org)
    return db_org

# 3. Update an Organization
@router.put("/{org_id}", response_model=schemas.OrganizationResponse)
def update_organization(org_id: int, org: schemas.OrganizationUpdate, db: Session = Depends(get_db)):
    db_org = db.query(models.OrganizationModel).filter(models.OrganizationModel.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    for key, value in org.dict(exclude_unset=True).items():
        setattr(db_org, key, value)
    
    db.commit()
    db.refresh(db_org)
    return db_org

# 4. Delete / Deactivate an Organization
@router.delete("/{org_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_organization(org_id: int, db: Session = Depends(get_db)):
    db_org = db.query(models.OrganizationModel).filter(models.OrganizationModel.id == org_id).first()
    if not db_org:
        raise HTTPException(status_code=404, detail="Organization not found")
    
    db.delete(db_org)
    db.commit()
    return None