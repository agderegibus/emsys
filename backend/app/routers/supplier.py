"""
Supplier management router.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_admin, get_branch_context
from app.models.user import User
from app.models.supplier import Supplier
from app.models.stock_movement import StockMovement
from app.schemas.supplier import SupplierCreate, SupplierUpdate, SupplierOut, SupplierWithStats

router = APIRouter(prefix="/suppliers", tags=["suppliers"])


@router.post("", response_model=SupplierOut)
def create_supplier(
    supplier: SupplierCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Create a new supplier."""
    db_supplier = Supplier(**supplier.model_dump())
    db.add(db_supplier)
    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.get("", response_model=list[SupplierOut])
def list_suppliers(
    q: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """List all suppliers with optional search."""
    query = db.query(Supplier)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (Supplier.name.ilike(search)) | (Supplier.email.ilike(search))
        )

    suppliers = query.order_by(desc(Supplier.created_at)).offset(skip).limit(limit).all()
    return suppliers


@router.get("/with-stats", response_model=list[SupplierWithStats])
def list_suppliers_with_stats(
    q: Optional[str] = Query(None, description="Search by name or email"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """List suppliers with purchase statistics (filtered by branch)."""
    query = db.query(Supplier)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (Supplier.name.ilike(search)) | (Supplier.email.ilike(search))
        )

    suppliers = query.order_by(desc(Supplier.created_at)).offset(skip).limit(limit).all()

    result = []
    for supplier in suppliers:
        # Get purchase statistics from stock movements (filtered by branch)
        mov_query = (
            db.query(StockMovement)
            .filter(
                StockMovement.supplier_id == supplier.id,
                StockMovement.movement_type == "entrada"
            )
        )
        if branch_id is not None:
            mov_query = mov_query.filter(StockMovement.branch_id == branch_id)
        movements = mov_query.all()

        total_purchases = len(movements)
        total_spent = sum(
            (m.purchase_price_ars or 0) * m.quantity
            for m in movements
            if m.purchase_price_ars
        )
        last_purchase_date = max((m.created_at for m in movements), default=None)

        result.append(
            SupplierWithStats(
                id=supplier.id,
                name=supplier.name,
                contact_name=supplier.contact_name,
                phone=supplier.phone,
                email=supplier.email,
                address=supplier.address,
                notes=supplier.notes,
                created_at=supplier.created_at,
                total_purchases=total_purchases,
                total_spent=total_spent,
                last_purchase_date=last_purchase_date,
            )
        )

    return result


@router.get("/{supplier_id}", response_model=SupplierOut)
def get_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Get a specific supplier by ID."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")
    return supplier


@router.get("/{supplier_id}/purchases")
def get_supplier_purchases(
    supplier_id: int,
    limit: int = Query(50, description="Number of recent purchases to return"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """Get recent purchases from a specific supplier (filtered by branch)."""
    supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    mov_query = (
        db.query(StockMovement)
        .filter(
            StockMovement.supplier_id == supplier_id,
            StockMovement.movement_type == "entrada"
        )
    )
    if branch_id is not None:
        mov_query = mov_query.filter(StockMovement.branch_id == branch_id)
    movements = (
        mov_query
        .order_by(desc(StockMovement.created_at))
        .limit(limit)
        .all()
    )

    total_purchases = len(movements)
    total_spent = sum(
        (m.purchase_price_ars or 0) * m.quantity
        for m in movements
        if m.purchase_price_ars
    )

    return {
        "supplier": SupplierOut.model_validate(supplier),
        "purchases": [
            {
                "id": m.id,
                "product_id": m.product_id,
                "quantity": m.quantity,
                "purchase_price_ars": m.purchase_price_ars,
                "total_price": (m.purchase_price_ars or 0) * m.quantity,
                "created_at": m.created_at,
                "reason": m.reason,
            }
            for m in movements
        ],
        "total_purchases": total_purchases,
        "total_spent": total_spent,
    }


@router.put("/{supplier_id}", response_model=SupplierOut)
def update_supplier(
    supplier_id: int,
    supplier_update: SupplierUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Update a supplier's information."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    update_data = supplier_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_supplier, field, value)

    db.commit()
    db.refresh(db_supplier)
    return db_supplier


@router.delete("/{supplier_id}")
def delete_supplier(
    supplier_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
):
    """Delete a supplier."""
    db_supplier = db.query(Supplier).filter(Supplier.id == supplier_id).first()
    if not db_supplier:
        raise HTTPException(status_code=404, detail="Supplier not found")

    db.delete(db_supplier)
    db.commit()
    return {"message": "Supplier deleted successfully"}
