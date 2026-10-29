from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List



from app.db import get_db
from app.models import User, Role, Permission
from app import models, schemas

router = APIRouter(prefix="/api/videos", tags=["Videos"])

@router.get("", response_model=List[schemas.VideoResponse])
def get_videos(db: Session = Depends(get_db)):
    return db.query(models.VideoModel).all()


def handle_tags(tag_names: List[str], db: Session):
    tag_objects = []
    for name in tag_names:
        clean_name = name.strip().lower()
        if not clean_name:
            continue
        # Check if tag already exists
        db_tag = db.query(models.TagModel).filter(models.TagModel.name == clean_name).first()
        if not db_tag:
            db_tag = models.TagModel(name=clean_name)
            db.add(db_tag)
            db.commit()
            db.refresh(db_tag)
        tag_objects.append(db_tag)
    return tag_objects

@router.post("", response_model=schemas.VideoResponse, status_code=status.HTTP_201_CREATED)
def create_video(video_data: schemas.VideoCreate, db: Session = Depends(get_db)):
    # 1. Create main video record
    db_video = models.VideoModel(
        category_id=video_data.category_id,
        default_title=video_data.default_title,
        default_description=video_data.default_description,
        duration_seconds=video_data.duration_seconds,
        default_thumbnail_url=video_data.default_thumbnail_url,
        is_published=video_data.is_published,
        tags=handle_tags(video_data.tags, db)
    )
    db.add(db_video)
    db.commit()
    db.refresh(db_video)

    # 2. Create associated streams
    for stream in video_data.streams:
        db_stream = models.VideoStreamModel(
            video_id=db_video.id,
            language=stream.language,
            stream_url=stream.stream_url,
            thumbnail_url=stream.thumbnail_url,
            title=stream.title
        )
        db.add(db_stream)
    
    db.commit()
    db.refresh(db_video)
    return db_video

@router.put("/{video_id}", response_model=schemas.VideoResponse)
def update_video(video_id: int, video_data: schemas.VideoUpdate, db: Session = Depends(get_db)):
    db_video = db.query(models.VideoModel).filter(models.VideoModel.id == video_id).first()
    if not db_video:
        raise HTTPException(status_code=404, detail="Video not found")
    
    # Update main fields if provided
    if video_data.default_title is not None: db_video.default_title = video_data.default_title
    if video_data.default_description is not None: db_video.default_description = video_data.default_description
    if video_data.category_id is not None: db_video.category_id = video_data.category_id
    if video_data.duration_seconds is not None: db_video.duration_seconds = video_data.duration_seconds
    if video_data.default_thumbnail_url is not None: db_video.default_thumbnail_url = video_data.default_thumbnail_url
    if video_data.is_published is not None: db_video.is_published = video_data.is_published

    # Refresh streams if provided (replace old streams with new ones)
    if video_data.streams is not None:
        db.query(models.VideoStreamModel).filter(models.VideoStreamModel.video_id == video_id).delete()
        for stream in video_data.streams:
            db_stream = models.VideoStreamModel(
                video_id=db_video.id,
                language=stream.language,
                stream_url=stream.stream_url,
                thumbnail_url=stream.thumbnail_url,
                title=stream.title
            )
            db.add(db_stream)

    db.commit()
    db.refresh(db_video)
    return db_video

@router.delete("/{video_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_video(video_id: int, db: Session = Depends(get_db)):
    db_video = db.query(models.VideoModel).filter(models.VideoModel.id == video_id).first()
    if not db_video:
        raise HTTPException(status_code=404, detail="Video not found")
    db.delete(db_video)
    db.commit()
    return None