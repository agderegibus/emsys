from datetime import datetime
from sqlalchemy import Integer, String, Boolean, DateTime, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.sql import func

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    username: Mapped[str] = mapped_column(String(50), unique=True, nullable=False)
    email: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(String(255), nullable=True)
    role: Mapped[str] = mapped_column(String(20), nullable=False, default="cajero", index=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now()
    )

    # Relationships
    user_branches: Mapped[list["UserBranch"]] = relationship(
        "UserBranch",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    branches: Mapped[list["Branch"]] = relationship(
        "Branch",
        secondary="user_branch",
        back_populates="users",
        viewonly=True
    )

    __table_args__ = (
        CheckConstraint("role IN ('admin', 'cajero')", name="valid_role"),
    )
