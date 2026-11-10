from fastapi import APIRouter, Depends, Query, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import or_, desc, asc
from typing import Optional, List
from datetime import datetime

from app.db import get_db
from app.models import User, Role, Permission, CustomerModel
from app import models, schemas

router = APIRouter(prefix="/api/videos", tags=["Videos"])

@router.get("")
def get_videos(
    search: Optional[str] = None,
    category: Optional[str] = None,
    sort: Optional[str] = "recent",
    limit: int = Query(50, le=100),
    offset: int = 0,
    db: Session = Depends(get_db)
):
    try:
        # Base query with joinedloads to fetch category, streams, and tags efficiently
        query = db.query(models.VideoModel).options(
            joinedload(models.VideoModel.category),
            joinedload(models.VideoModel.streams),
            joinedload(models.VideoModel.tags)
        )

        # 1. Search filter (title, description, or tags)
        if search and search.strip():
            q = f"%{search.strip().lower()}%"
            query = query.outerjoin(models.VideoModel.tags).filter(
                or_(
                    models.VideoModel.default_title.ilike(q),
                    models.VideoModel.default_description.ilike(q),
                    models.TagModel.name.ilike(q)
                )
            ).distinct()

        # 2. Category filter (handles both ID or name lookup)
        if category and category != "All":
            if category.isdigit():
                query = query.filter(models.VideoModel.category_id == int(category))
            else:
                query = query.join(models.VideoModel.category).filter(
                    models.CategoryModel.name.ilike(f"%{category}%")
                )

        # 3. Sorting
        if sort == "views":
            query = query.order_by(desc(models.VideoModel.duration_seconds))  # Update to views column if available
        elif sort == "featured":
            query = query.order_by(desc(models.VideoModel.is_published))
        else:  # recent
            query = query.order_by(desc(models.VideoModel.created_at))

        total = query.count()
        videos = query.offset(offset).limit(limit).all()
        has_more = offset + limit < total

        # Format output to explicitly expose dynamic category names
        formatted_videos = []
        for v in videos:
            formatted_videos.append({
                "id": v.id,
                "category_id": v.category_id,
                "category_name": v.category.name if v.category else "Uncategorized",
                "default_title": v.default_title,
                "default_description": v.default_description,
                "duration_seconds": v.duration_seconds,
                "default_thumbnail_url": v.default_thumbnail_url,
                "is_published": v.is_published,
                "streams": [{"id": s.id, "language": s.language, "url": s.url} for s in v.streams] if v.streams else [],
                "tags": [t.name for t in v.tags] if v.tags else []
            })

        return {
            "videos": formatted_videos,
            "total": total,
            "hasMore": has_more
        }
    except Exception as error:
        raise HTTPException(status_code=500, detail=str(error))

@router.get("/categories")
def get_categories(db: Session = Depends(get_db)):
    # Assuming your category model is named CategoryModel
    categories = db.query(models.CategoryModel).all()
    return [{"id": c.id, "name": c.name} for c in categories]

@router.get("/tags", response_model=None)
def get_tags(db: Session = Depends(get_db)):
    # Assuming your tag model is named TagModel
    tags = db.query(models.TagModel).all()
    return [{"id": t.id, "name": t.name} for t in tags]


@router.get("/champions/{token}")
def get_champion_by_token(token: str, db: Session = Depends(get_db)):
    # Query database for user matching champion_token
    champion = db.query(CustomerModel).filter(CustomerModel.champion_token == token.strip()).first()

    print("Fetched champion object:", champion)
    
    if not champion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, 
            detail="Content champion profile not found"
        )
    
    return {
        "id": champion.id,
        "name": champion.name,
        "email": champion.email,
        "champion_token": champion.champion_token,
        #"initials": champion.initials or champion.name[:2].upper()
    }