from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime


class CustomerCreate(BaseModel):
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None


class CustomerOut(BaseModel):
    id: int
    name: str
    phone: Optional[str] = None
    email: Optional[str] = None
    address: Optional[str] = None
    created_at: datetime

    class Config:
        from_attributes = True


class CustomerWithStats(CustomerOut):
    total_purchases: int
    total_spent: int
    last_purchase_date: Optional[datetime] = None
