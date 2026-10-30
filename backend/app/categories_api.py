from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.db import get_db
from app import models, schemas

router = APIRouter(prefix="/api/categories", tags=["Categories"])

@router.post("", response_model=schemas.CategoryOut, status_code=status.HTTP_201_CREATED)
def create_category(category: schemas.CategoryCreate, db: Session = Depends(get_db)):
    # 1. Check if category name already exists
    existing_category = db.query(models.Category).filter(
        models.Category.name == category.name
    ).first()
    
    if existing_category:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Category with this name already exists"
        )
    
    # 2. Save new category to database
    new_category = models.Category(
        name=category.name,
        description=category.description,
        slug=category.slug if category.slug else category.name.lower().replace(" ", "-"),
        status=category.status if category.status is not None else 1
    )
    db.add(new_category)
    db.commit()
    db.refresh(new_category)
    
    return new_category


@router.get("", response_model=List[schemas.CategoryOut])
def get_categories(db: Session = Depends(get_db)):
    return db.query(models.Category).all()


@router.put("/{category_id}", response_model=schemas.CategoryOut)
def update_category(
    category_id: int, 
    category_data: schemas.CategoryUpdate, 
    db: Session = Depends(get_db)
):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found"
        )

    # Check for name conflict if changing name
    if category_data.name and category_data.name != category.name:
        existing = db.query(models.Category).filter(models.Category.name == category_data.name).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST, 
                detail="Category name already exists"
            )
        category.name = category_data.name

    if category_data.description is not None:
        category.description = category_data.description

    if category_data.slug is not None:
        category.slug = category_data.slug 

    if category_data.status is not None:
        category.status = category_data.status          

    db.commit()
    db.refresh(category)
    return category


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_category(category_id: int, db: Session = Depends(get_db)):
    category = db.query(models.Category).filter(models.Category.id == category_id).first()
    
    if not category:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Category not found"
        )

    db.delete(category)
    db.commit()
    return None