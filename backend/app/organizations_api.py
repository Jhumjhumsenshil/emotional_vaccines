from fastapi import APIRouter, Depends, HTTPException, status, Form, File, UploadFile
from sqlalchemy.orm import Session
from typing import List
from pathlib import Path
import shutil
import uuid

# Import your database session, models, and schemas here
# from database import get_db
# import models, schemas

from app.db import get_db
from app.models import User, Role, Permission
from app import models, schemas

router = APIRouter(prefix="/api/organizations", tags=["Organizations"])

UPLOAD_DIR = Path("uploads/logos")
UPLOAD_DIR.mkdir(parents=True, exist_ok=True) # Creates folder if it doesn't exist

# 1. Get All Organizations
@router.get("", response_model=List[schemas.OrganizationResponse])
def get_organizations(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    orgs = db.query(models.OrganizationModel).offset(skip).limit(limit).all()
    return orgs

# 2. Create an Organization
@router.post("", response_model=schemas.OrganizationResponse, status_code=status.HTTP_201_CREATED)
def create_organization(
    name: str = Form(...),
    slug: str = Form(...),
    description: str = Form(None),
    is_active: bool = Form(True),
    logo: UploadFile = File(None), # Optional logo file upload
    db: Session = Depends(get_db)
):
    # 1. Check for duplicate slug
    existing = db.query(models.OrganizationModel).filter(models.OrganizationModel.slug == slug).first()
    if existing:
        raise HTTPException(status_code=400, detail=f"Slug '{slug}' is already in use.")
    
    logo_url = None

    # 2. Handle logo file upload if provided
    if logo:
        ext = logo.filename.split(".")[-1].lower()
        if ext not in ["png", "jpeg", "jpg", "svg"]:
            raise HTTPException(status_code=400, detail="Invalid image format. Allowed: PNG, JPEG, SVG")

        # Generate a unique filename using uuid4 and keep the original file extension
        unique_filename = f"{uuid.uuid4()}.{ext}"

        # Save file locally into the server folder
        file_path = UPLOAD_DIR / unique_filename
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(logo.file, buffer)
        
        # Generate relative URL path to store in the database column
        logo_url = f"/static/logos/{unique_filename}"

    # 3. Create database model instance with fields and the local logo URL path
    db_org = models.OrganizationModel(
        name=name,
        slug=slug,
        description=description,
        is_active=is_active,
        logo_url=logo_url
    )

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