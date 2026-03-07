from datetime import datetime
from sqlalchemy import Column, Integer, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from app.core.database import Base


class BranchStock(Base):
    """
    Stock levels per product per branch.
    Each branch has its own inventory for each product.
    """
    __tablename__ = "branch_stock"

    id = Column(Integer, primary_key=True, index=True)
    branch_id = Column(Integer, ForeignKey("branches.id", ondelete="CASCADE"), nullable=False)
    product_id = Column(Integer, ForeignKey("products.id", ondelete="CASCADE"), nullable=False)
    stock_qty = Column(Integer, nullable=False, default=0)
    min_stock = Column(Integer, nullable=True, default=10)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    branch = relationship("Branch", back_populates="branch_stocks")
    product = relationship("Product", back_populates="branch_stocks")

    # Unique constraint: one stock record per branch-product combination
    __table_args__ = (
        UniqueConstraint('branch_id', 'product_id', name='uq_branch_product'),
    )

    def __repr__(self):
        return f"<BranchStock(branch_id={self.branch_id}, product_id={self.product_id}, qty={self.stock_qty})>"
