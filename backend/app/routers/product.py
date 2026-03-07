from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import get_current_user, get_branch_context
from app.models.product import Product
from app.models.branch_stock import BranchStock
from app.models.user import User
from app.schemas.product import ProductCreate, ProductOut

router = APIRouter(prefix="/products", tags=["products"])


@router.post("", response_model=ProductOut)
def create_product(
    payload: ProductCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    p = Product(**payload.model_dump())
    db.add(p)
    db.commit()
    db.refresh(p)
    return p


@router.get("", response_model=list[ProductOut])
def list_products(
    current_user: User = Depends(get_current_user),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    List all products with branch-specific stock levels.
    If a branch is specified, returns stock for that branch.
    If no branch is specified, returns the global stock_qty.
    """
    products = db.query(Product).order_by(Product.id.desc()).all()

    if branch_id is None:
        # No branch context, return products with global stock
        return products

    # Get branch stocks for all products in this branch
    branch_stocks = db.query(BranchStock).filter(
        BranchStock.branch_id == branch_id
    ).all()
    stock_by_product = {bs.product_id: bs.stock_qty for bs in branch_stocks}

    # Build response with branch-specific stock
    results = []
    for p in products:
        product_dict = {
            "id": p.id,
            "category": p.category,
            "subcategory": p.subcategory,
            "name": p.name,
            "variant": p.variant,
            "price_ars": p.price_ars,
            "description": p.description,
            "is_active": p.is_active,
            "stock_qty": stock_by_product.get(p.id, 0)  # Branch stock or 0
        }
        results.append(ProductOut(**product_dict))

    return results
