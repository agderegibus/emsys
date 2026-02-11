from sqlalchemy import Boolean, Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.core.database import Base


class Product(Base):
    __tablename__ = "products"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    category: Mapped[str] = mapped_column(String(100), index=True)
    subcategory: Mapped[str | None] = mapped_column(String(100), nullable=True, index=True)

    name: Mapped[str] = mapped_column(String(200), index=True)
    variant: Mapped[str | None] = mapped_column(String(100), nullable=True)

    price_ars: Mapped[int] = mapped_column(Integer)

    description: Mapped[str | None] = mapped_column(Text, nullable=True)

    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    stock_qty: Mapped[int] = mapped_column(Integer, default=0)

    # Relationships
    suppliers: Mapped[list["Supplier"]] = relationship(
        "Supplier",
        secondary="product_supplier",
        back_populates="products"
    )
