from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from app.schemas import ChampionVideoCreate,VideoPublishUpdate

from app.models import ChampionVideoModel, CustomerModel

from typing import List
from app.auth import verify_access_token



from app.db import get_db
from app.models import User, Role, Permission
from app import models, schemas




router = APIRouter(prefix="/api/videos", tags=["Videos"])


@router.get("/list", dependencies=[Depends(verify_access_token)])
def get_videos_champion(db: Session = Depends(get_db)):
    videos = db.query(models.VideoModel).options(        
        joinedload(models.VideoModel.streams),
        joinedload(models.VideoModel.categories),
        joinedload(models.VideoModel.tags)
    ).all()
    
    return videos



@router.post("", response_model=schemas.VideoResponse, status_code=status.HTTP_201_CREATED, dependencies=[Depends(verify_access_token)])
def create_video(video_data: schemas.VideoCreate, db: Session = Depends(get_db)):
    # 1. Fetch categories based on incoming IDs list
    categories = []
    if video_data.category_ids:
        categories = db.query(models.Category).filter(models.Category.id.in_(video_data.category_ids)).all()
    # 1. Create main video record
    db_video = models.VideoModel(       
        default_title=video_data.default_title,
        default_description=video_data.default_description,
        duration_seconds=video_data.duration_seconds,
        default_thumbnail_url=video_data.default_thumbnail_url,
        is_published=video_data.is_published,
        is_default=video_data.is_default,
        categories=categories,
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

@router.put("/{video_id}", response_model=schemas.VideoResponse, dependencies=[Depends(verify_access_token)])
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
    if video_data.is_default is not None: db_video.is_default = video_data.is_default

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



@router.patch("/{video_id}/publish")
def update_video_publish_status(
    video_id: int,
    payload: VideoPublishUpdate,
    db: Session = Depends(get_db)
):
    video = db.query(models.VideoModel).filter(models.VideoModel.id == video_id).first()
    if not video:
        raise HTTPException(status_code=404, detail="Video not found")

    video.is_published = payload.is_published
    db.commit()
    db.refresh(video)

    return {
        "status": "success",
        "id": video.id,
        "is_published": video.is_published
    }



#####content champion ##############
@router.get("", response_model=List[schemas.VideoResponse])
# def get_videos(db: Session = Depends(get_db)):
#     return db.query(models.VideoModel).all()
def get_videos(db: Session = Depends(get_db)):
    videos = db.query(models.VideoModel).filter(        
        models.VideoModel.is_published == True).options(        
        joinedload(models.VideoModel.streams),
        joinedload(models.VideoModel.categories),
        joinedload(models.VideoModel.tags)
    ).all()
    
    return videos


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



@router.get("/default_video", tags=["Videos"])
def get_default_videos(db: Session = Depends(get_db)):
    """
    Fetch all videos where is_default is true.
    """
    default_videos = db.query(models.VideoModel).filter(
        models.VideoModel.is_default == True,
        models.VideoModel.is_published == True).all()
    
    if not default_videos:
        # Optional: return an empty list or raise 404 depending on your preference
        return []
        
    return default_videos




# @router.post("/champions/{token}/videos")
# def save_champion_video(token: str, payload: ChampionVideoCreate, db: Session = Depends(get_db)):
#     # Verify champion by token
#     customer = db.query(models.CustomerModel).filter(models.CustomerModel.champion_token == token).first()
#     if not customer:
#         raise HTTPException(status_code=404, detail="Champion not found")
        
#     # Save or update selection logic here...
#     return {"status": "success", "message": "Video preference saved"}


@router.post("/champions/{token}/videos")
def save_champion_video(token: str, payload: ChampionVideoCreate, db: Session = Depends(get_db)):
    # 1. Lookup customer/champion by token
    customer = db.query(models.CustomerModel).filter(models.CustomerModel.id == token).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer/Champion not found")

    # 2. Check if already saved, or create new record
    existing = db.query(ChampionVideoModel).filter(
        ChampionVideoModel.customer_id == customer.id,
        ChampionVideoModel.video_id == payload.video_id
    ).first()

    if existing:
        existing.rating = payload.rating
        existing.selected_language = payload.selected_language
    else:
        new_entry = ChampionVideoModel(
            customer_id=customer.id,
            video_id=payload.video_id,
            rating=payload.rating,
            selected_language=payload.selected_language
        )
        db.add(new_entry)
    
    db.commit()
    return {"status": "success", "message": "Video preference saved"}



@router.get("/champions/{token}/videos")
def get_champion_videos(token: str, db: Session = Depends(get_db)):
    # Lookup customer by token or ID (adjust filter if passing customer.id)
    customer = db.query(CustomerModel).filter(
        (CustomerModel.id == token) | (CustomerModel.id == int(token) if token.isdigit() else False)
    ).first()
    
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    saved_entries = (
        db.query(ChampionVideoModel)
        .options(joinedload(ChampionVideoModel.video))
        .filter(ChampionVideoModel.customer_id == customer.id)
        .all()
    )

    return [
        {
            "id": str(entry.video.id),
            "title": entry.video.default_title,
            "description": entry.video.default_description,
            "thumbnail": entry.video.default_thumbnail_url,
            "category": entry.video.categories[0].name if entry.video.categories else "General",
            "rating": entry.rating,
            "languages": [entry.selected_language] if entry.selected_language else ["EN"],
            "isDefault": False,
        }
        for entry in saved_entries
        if entry.video
    ]


@router.delete("/champions/{token}/videos/{video_id}")
def delete_champion_video(token: str, video_id: int, db: Session = Depends(get_db)):
    # Lookup customer by token or numeric ID
    customer = db.query(CustomerModel).filter(
        (CustomerModel.id == token) | (CustomerModel.id == int(token) if token.isdigit() else False)
    ).first()

    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    entry = db.query(ChampionVideoModel).filter(
        ChampionVideoModel.customer_id == customer.id,
        ChampionVideoModel.video_id == video_id
    ).first()

    if entry:
        db.delete(entry)
        db.commit()

    return {"status": "success", "message": "Video removed from champion selections"}