from pydantic import BaseModel, HttpUrl
from typing import Optional, List
from datetime import datetime

class PermissionOut(BaseModel):
    id: int
    slug: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None

    class Config:
        from_attributes = True

class RoleDetailOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    users_count: int = 0
    permissions: list[PermissionOut] = []

    class Config:
        from_attributes = True

class RoleCreate(BaseModel):
    name: str
    description: Optional[str] = None
    permission_ids: list[int] = []

class RoleUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    permission_ids: Optional[list[int]] = None

class CategoryCreate(BaseModel):
    name: str
    description: Optional[str] = None
    slug: Optional[str] = None
    status: Optional[int] = 1  # 1 = Active, 0 = Inactive

class CategoryUpdate(BaseModel):
    name: Optional[str] = None
    slug: Optional[str] = None
    description: Optional[str] = None
    status: Optional[int] = None  # <--- Allows updating just status


# Response schema
class CategoryOut(BaseModel):
    id: int
    name: str
    slug: str
    description: Optional[str] = None
    status: int = 1  # <--- Included in response

    class Config:
        from_attributes = True  


class OrganizationBase(BaseModel):
    name: str
    description: Optional[str] = None
    slug: str
    logo_url: Optional[str] = None
    is_active: bool = True

class OrganizationCreate(OrganizationBase):
    pass

class OrganizationUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    slug: Optional[str] = None
    logo_url: Optional[str] = None
    is_active: Optional[bool] = None

class OrganizationResponse(OrganizationBase):
    id: int
    created_at: Optional[datetime] = None

    class Config:
        orm_mode = True              


class VideoStreamCreate(BaseModel):
    language: str
    stream_url: str
    thumbnail_url: Optional[str] = None
    title: Optional[str] = None

class VideoStreamResponse(VideoStreamCreate):
    id: int
    video_id: int
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

class VideoCreate(BaseModel):
    category_id: Optional[int] = None
    default_title: str
    default_description: Optional[str] = None
    duration_seconds: int = 0
    default_thumbnail_url: Optional[str] = None
    is_published: bool = True
    streams: List[VideoStreamCreate] = []

class VideoUpdate(BaseModel):
    category_id: Optional[int] = None
    default_title: Optional[str] = None
    default_description: Optional[str] = None
    duration_seconds: Optional[int] = None
    default_thumbnail_url: Optional[str] = None
    is_published: Optional[bool] = None
    streams: Optional[List[VideoStreamCreate]] = None

class VideoResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    default_title: str
    default_description: Optional[str] = None
    duration_seconds: int
    default_thumbnail_url: Optional[str] = None
    is_published: bool
    created_at: Optional[datetime] = None
    streams: List[VideoStreamResponse] = []

    class Config:
        from_attributes = True  

class TagResponse(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

# Update VideoCreate & VideoResponse to handle tags
class VideoCreate(BaseModel):
    category_id: Optional[int] = None
    default_title: str
    default_description: Optional[str] = None
    duration_seconds: int = 0
    default_thumbnail_url: Optional[str] = None
    is_published: bool = True
    streams: List[VideoStreamCreate] = []
    tags: List[str] = [] # 👈 Accepts list of tag strings from frontend

class VideoResponse(BaseModel):
    id: int
    category_id: Optional[int] = None
    default_title: str
    default_description: Optional[str] = None
    duration_seconds: int
    default_thumbnail_url: Optional[str] = None
    is_published: bool
    streams: List[VideoStreamResponse] = []
    tags: List[TagResponse] = [] # 👈 Returns structured tag objects

    class Config:
        from_attributes = True              