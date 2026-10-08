from pydantic import BaseModel
from typing import Optional

class RoleOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True

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