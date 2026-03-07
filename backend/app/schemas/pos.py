from pydantic import BaseModel
from typing import Optional, Literal
from datetime import datetime


class SaleItemCreate(BaseModel):
    product_id: int
    qty: int


class SaleCreate(BaseModel):
    customer_id: Optional[int] = None
    is_invoiced: bool = False
    payment_method: Optional[Literal["efectivo", "tarjeta", "mercadopago"]] = None
    cashier: Optional[str] = None
    is_delivery: bool = False
    delivery_address: Optional[str] = None
    branch_id: Optional[int] = None
    items: list[SaleItemCreate]


class SaleItemOut(BaseModel):
    product_id: int
    qty: int
    unit_price_ars: int
    line_total_ars: int

    class Config:
        from_attributes = True


class SaleOut(BaseModel):
    id: int
    created_at: datetime
    customer_id: Optional[int]
    is_invoiced: bool
    total_ars: int
    payment_method: Optional[str] = None
    cashier: Optional[str] = None
    is_delivery: bool = False
    delivery_address: Optional[str] = None
    delivery_person_id: Optional[int] = None
    branch_id: Optional[int] = None
    items: list[SaleItemOut]

    class Config:
        from_attributes = True


class AssignDeliveryPersonRequest(BaseModel):
    sale_id: int
    delivery_person_id: int
