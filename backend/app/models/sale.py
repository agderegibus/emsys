from datetime import datetime
from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Sale(Base):
    __tablename__ = "sales"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, index=True)

    customer_id: Mapped[int | None] = mapped_column(ForeignKey("customers.id"), nullable=True)
    is_invoiced: Mapped[bool] = mapped_column(Boolean, default=False)

    total_ars: Mapped[int] = mapped_column(Integer, default=0)

    payment_method: Mapped[str | None] = mapped_column(String(50), nullable=True, index=True)
    cashier: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    # Delivery fields
    is_delivery: Mapped[bool] = mapped_column(Boolean, default=False, index=True)
    delivery_address: Mapped[str | None] = mapped_column(Text, nullable=True)
    delivery_person_id: Mapped[int | None] = mapped_column(
        ForeignKey("delivery_persons.id", ondelete="SET NULL"), nullable=True, index=True
    )

    items: Mapped[list["SaleItem"]] = relationship(
        "SaleItem", back_populates="sale", cascade="all, delete-orphan"
    )
    customer: Mapped["Customer"] = relationship("Customer", back_populates="sales")
    delivery_person: Mapped["DeliveryPerson"] = relationship("DeliveryPerson", back_populates="deliveries")


class SaleItem(Base):
    __tablename__ = "sale_items"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    sale_id: Mapped[int] = mapped_column(ForeignKey("sales.id"), index=True)
    product_id: Mapped[int] = mapped_column(ForeignKey("products.id"), index=True)

    qty: Mapped[int] = mapped_column(Integer)
    unit_price_ars: Mapped[int] = mapped_column(Integer)
    line_total_ars: Mapped[int] = mapped_column(Integer)

    sale: Mapped["Sale"] = relationship("Sale", back_populates="items")
