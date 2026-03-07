from pydantic import BaseModel, Field
from typing import Optional, Literal
from datetime import datetime


class StockMovementCreate(BaseModel):
    product_id: int = Field(..., gt=0)
    movement_type: Literal["entrada", "salida", "ajuste"]
    quantity: int = Field(..., gt=0)
    reason: Optional[str] = None
    user_id: Optional[int] = None
    sale_id: Optional[int] = None
    supplier_id: Optional[int] = None
    purchase_price_ars: Optional[int] = Field(None, ge=0)
    branch_id: Optional[int] = None


class StockMovementOut(BaseModel):
    id: int
    product_id: int
    movement_type: str
    quantity: int
    reason: Optional[str] = None
    previous_stock: int
    new_stock: int
    user_id: Optional[int] = None
    sale_id: Optional[int] = None
    supplier_id: Optional[int] = None
    purchase_price_ars: Optional[int] = None
    branch_id: Optional[int] = None
    created_at: datetime

    # Joined fields (optional)
    product_name: Optional[str] = None
    product_category: Optional[str] = None
    user_name: Optional[str] = None
    supplier_name: Optional[str] = None
    branch_name: Optional[str] = None

    class Config:
        from_attributes = True


class ProductStockOut(BaseModel):
    product_id: int
    product_name: str
    category: str
    variant: Optional[str] = None
    current_stock: int
    min_stock: int = 10

    class Config:
        from_attributes = True


class ProductRepositionOut(BaseModel):
    product_id: int
    product_name: str
    category: str
    variant: Optional[str] = None
    current_stock: int
    min_stock: int
    units_needed: int
    suggested_supplier_id: Optional[int] = None
    suggested_supplier_name: Optional[str] = None

    class Config:
        from_attributes = True
