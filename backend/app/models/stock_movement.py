from sqlalchemy import Integer, String, Text, ForeignKey, DateTime, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func
from datetime import datetime

from app.core.database import Base


class StockMovement(Base):
    __tablename__ = "stock_movements"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)

    product_id: Mapped[int] = mapped_column(
        Integer,
        ForeignKey("products.id", ondelete="CASCADE"),
        nullable=False,
        index=True
    )

    movement_type: Mapped[str] = mapped_column(
        String(20),
        nullable=False,
        index=True
    )

    quantity: Mapped[int] = mapped_column(Integer, nullable=False)

    reason: Mapped[str | None] = mapped_column(Text, nullable=True)

    previous_stock: Mapped[int] = mapped_column(Integer, nullable=False)
    new_stock: Mapped[int] = mapped_column(Integer, nullable=False)

    user_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True
    )

    sale_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("sales.id", ondelete="SET NULL"),
        nullable=True
    )

    supplier_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("suppliers.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    purchase_price_ars: Mapped[int | None] = mapped_column(Integer, nullable=True)

    # Branch
    branch_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("branches.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
        index=True
    )

    # Relationships
    supplier: Mapped["Supplier"] = relationship("Supplier", back_populates="stock_movements")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="stock_movements")

    __table_args__ = (
        CheckConstraint("movement_type IN ('entrada', 'salida', 'ajuste')", name="valid_movement_type"),
        CheckConstraint("quantity > 0", name="positive_quantity"),
    )
