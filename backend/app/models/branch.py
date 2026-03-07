from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class Branch(Base):
    __tablename__ = "branches"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    code: Mapped[str] = mapped_column(String(10), nullable=False, unique=True)
    address: Mapped[str | None] = mapped_column(Text, nullable=True)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    # Relationships
    user_branches: Mapped[list["UserBranch"]] = relationship(
        "UserBranch",
        back_populates="branch",
        cascade="all, delete-orphan"
    )
    users: Mapped[list["User"]] = relationship(
        "User",
        secondary="user_branch",
        back_populates="branches",
        viewonly=True
    )
    sales: Mapped[list["Sale"]] = relationship("Sale", back_populates="branch")
    stock_movements: Mapped[list["StockMovement"]] = relationship(
        "StockMovement",
        back_populates="branch"
    )
    delivery_persons: Mapped[list["DeliveryPerson"]] = relationship(
        "DeliveryPerson",
        back_populates="branch"
    )
    branch_stocks: Mapped[list["BranchStock"]] = relationship(
        "BranchStock",
        back_populates="branch",
        cascade="all, delete-orphan"
    )
