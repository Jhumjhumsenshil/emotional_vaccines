
from typing import Optional
from sqlalchemy import func, desc

@router.get("/stats/by-video")
def get_stats_by_video(
    customer_id: Optional[int] = None,
    db: Session = Depends(get_db)
):
    query = db.query(
        models.VideoClickModel.video_id,
        func.coalesce(func.max(models.VideoClickModel.video_title), models.VideoClickModel.video_id).label("video_title"),
        func.count(models.VideoClickModel.id).label("click_events"),
        func.coalesce(func.sum(models.VideoClickModel.count), 0).label("total_viewers"),
        func.count(func.distinct(models.VideoClickModel.customer_id)).label("unique_customers"),
    )

    if customer_id:
        query = query.filter(models.VideoClickModel.customer_id == customer_id)

    video_rows = (
        query.group_by(models.VideoClickModel.video_id)
        .order_by(desc("total_viewers"))
        .all()
    )

    # Fetch customer-level breakdown per video
    customer_breakdown_query = (
        db.query(
            models.VideoClickModel.video_id,
            models.CustomerModel.id.label("customer_id"),
            models.CustomerModel.name.label("customer_name"),
            models.CustomerModel.email.label("customer_email"),
            func.count(models.VideoClickModel.id).label("clicks"),
            func.coalesce(func.sum(models.VideoClickModel.count), 0).label("viewer_count"),
        )
        .join(models.CustomerModel, models.CustomerModel.id == models.VideoClickModel.customer_id)
    )

    if customer_id:
        customer_breakdown_query = customer_breakdown_query.filter(
            models.VideoClickModel.customer_id == customer_id
        )

    customer_rows = (
        customer_breakdown_query.group_by(
            models.VideoClickModel.video_id,
            models.CustomerModel.id,
            models.CustomerModel.name,
            models.CustomerModel.email,
        )
        .order_by(desc("viewer_count"))
        .all()
    )

    # Group customer details under each video_id
    customers_by_video: dict = {}
    for row in customer_rows:
        customers_by_video.setdefault(row.video_id, []).append({
            "customer_id": row.customer_id,
            "customer_name": row.customer_name,
            "customer_email": row.customer_email,
            "clicks": row.clicks,
            "viewer_count": int(row.viewer_count),
        })

    return [
        {
            "video_id": row.video_id,
            "video_title": row.video_title,
            "click_events": row.click_events,
            "total_viewers": int(row.total_viewers),
            "unique_customers": row.unique_customers,
            "customers": customers_by_video.get(row.video_id, []),
        }
        for row in video_rows
    ]

@router.post("/track-click", status_code=status.HTTP_201_CREATED)
def track_video_click(payload: schemas.VideoClickCreate, db: Session = Depends(get_db)):
    click_record = models.VideoClickModel(
        customer_id=payload.customer_id,
        video_id=str(payload.video_id),
        video_title=payload.video_title,
        language=payload.language,
        count=payload.count if payload.count and payload.count > 0 else 1,
    )
    db.add(click_record)
    db.commit()
    db.refresh(click_record)
    return {"status": "recorded", "clicks_added": click_record.count}



# ///////////model.py//////////

from sqlalchemy import Column, Integer, String, ForeignKey, DateTime, Index, CheckConstraint
from sqlalchemy.sql import func
from database import Base


class VideoClickModel(Base):
    __tablename__ = "video_clicks"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(
        Integer,
        ForeignKey("customers.id", ondelete="CASCADE"),
        nullable=False,
        index=True,
    )
    video_id = Column(String(255), nullable=False, index=True)
    video_title = Column(String(500), nullable=True)
    language = Column(String(10), nullable=False, default="EN", server_default="EN")
    count = Column(Integer, nullable=False, default=1, server_default="1")
    clicked_at = Column(
        DateTime(timezone=True),
        nullable=False,
        server_default=func.now(),
        index=True,
    )

    __table_args__ = (
        CheckConstraint("count > 0", name="ck_video_clicks_count_positive"),
        Index("ix_video_clicks_customer_date", "customer_id", "clicked_at"),
        Index("ix_video_clicks_video_date", "video_id", "clicked_at"),
    )