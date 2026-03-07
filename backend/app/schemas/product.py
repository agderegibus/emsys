from pydantic import BaseModel
from typing import Optional


class ProductCreate(BaseModel):
    category: str
    subcategory: Optional[str] = None
    name: str
    variant: Optional[str] = None
    price_ars: int
    description: Optional[str] = None
    is_active: bool = True
    stock_qty: int = 0


class ProductOut(BaseModel):
    id: int
    category: str
    subcategory: Optional[str] = None
    name: str
    variant: Optional[str] = None
    price_ars: int
    description: Optional[str] = None
    is_active: bool = True
    stock_qty: int = 0  # Branch-specific stock (or global if no branch)

    class Config:
        from_attributes = True
