from datetime import datetime
from sqlalchemy import Integer, String, Text, DateTime, Table, Column, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base

# Association table for many-to-many relationship
product_supplier = Table(
    'product_supplier',
    Base.metadata,
    Column('product_id', Integer, ForeignKey('products.id', ondelete='CASCADE'), primary_key=True),
    Column('supplier_id', Integer, ForeignKey('suppliers.id', ondelete='CASCADE'), primary_key=True),
    Column('supplier_product_code', String(100), nullable=True),
    Column('notes', Text, nullable=True)
)


class Supplier(Base):
    __tablename__ = "suppliers"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(200), index=True)
    contact_name: Mapped[str | None] = mapped_column(String(200), nullable=True)
    phone: Mapped[str | None] = mapped_column(String(50), nullable=True)
    email: Mapped[str | None] = mapped_column(String(255), nullable=True, index=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    notes: Mapped[str | None] = mapped_column(Text, nullable=True)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), default=datetime.utcnow)

    # Relationships
    products: Mapped[list["Product"]] = relationship(
        "Product",
        secondary=product_supplier,
        back_populates="suppliers"
    )
    stock_movements: Mapped[list["StockMovement"]] = relationship("StockMovement", back_populates="supplier")
