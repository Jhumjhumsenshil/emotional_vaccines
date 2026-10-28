from pydantic import BaseModel, HttpUrl
from typing import Optional
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