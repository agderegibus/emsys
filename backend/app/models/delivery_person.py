from sqlalchemy import Integer, String, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import datetime

from app.core.database import Base


class DeliveryPerson(Base):
    __tablename__ = "delivery_persons"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False)
    phone: Mapped[str | None] = mapped_column(String(20), nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Branch
    branch_id: Mapped[int | None] = mapped_column(
        Integer,
        ForeignKey("branches.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )

    # Relationships
    deliveries: Mapped[list["Sale"]] = relationship("Sale", back_populates="delivery_person")
    branch: Mapped["Branch"] = relationship("Branch", back_populates="delivery_persons")
