from pydantic import BaseModel
from typing import Optional


class DeliveryPersonCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    is_active: bool = True


class DeliveryPersonUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    is_active: Optional[bool] = None


class DeliveryPersonOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    is_active: bool

    class Config:
        from_attributes = True
