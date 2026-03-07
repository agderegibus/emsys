from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List, Optional

from app.core.database import get_db
from app.core.auth import get_current_user, require_admin, get_branch_context
from app.models.stock_movement import StockMovement
from app.models.product import Product
from app.models.user import User
from app.models.supplier import Supplier
from app.models.branch import Branch
from app.models.branch_stock import BranchStock
from app.schemas.stock import StockMovementCreate, StockMovementOut, ProductStockOut, ProductRepositionOut

router = APIRouter(prefix="/stock", tags=["stock"])


def get_or_create_branch_stock(db: Session, branch_id: int, product_id: int) -> BranchStock:
    """Get existing branch stock or create a new one with 0 stock."""
    branch_stock = db.query(BranchStock).filter(
        BranchStock.branch_id == branch_id,
        BranchStock.product_id == product_id
    ).first()

    if not branch_stock:
        branch_stock = BranchStock(
            branch_id=branch_id,
            product_id=product_id,
            stock_qty=0,
            min_stock=10
        )
        db.add(branch_stock)
        db.flush()  # Get the ID without committing

    return branch_stock


@router.post("/movements", response_model=StockMovementOut)
def create_stock_movement(
    payload: StockMovementCreate,
    current_user: User = Depends(require_admin),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    Create a new stock movement (entrada, salida, or ajuste).
    Automatically updates the branch's stock for this product.
    Admin only.
    """
    # Use branch from payload or context
    movement_branch_id = payload.branch_id or branch_id

    if movement_branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Se requiere especificar una sucursal para el movimiento de stock"
        )

    # Verify product exists
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Get or create branch stock
    branch_stock = get_or_create_branch_stock(db, movement_branch_id, payload.product_id)

    current_stock = branch_stock.stock_qty
    previous_stock = current_stock

    # Calculate new stock based on movement type
    if payload.movement_type == "entrada":
        new_stock = current_stock + payload.quantity
    elif payload.movement_type == "salida":
        if current_stock < payload.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Stock actual: {current_stock}, intentando dar de baja: {payload.quantity}"
            )
        new_stock = current_stock - payload.quantity
    else:  # ajuste
        new_stock = payload.quantity

    # Create stock movement record
    movement = StockMovement(
        product_id=payload.product_id,
        movement_type=payload.movement_type,
        quantity=payload.quantity,
        reason=payload.reason,
        previous_stock=previous_stock,
        new_stock=new_stock,
        user_id=current_user.id,
        sale_id=payload.sale_id,
        supplier_id=payload.supplier_id,
        purchase_price_ars=payload.purchase_price_ars,
        branch_id=movement_branch_id
    )

    db.add(movement)

    # Update branch stock
    branch_stock.stock_qty = new_stock

    db.commit()
    db.refresh(movement)

    # Add joined fields for response
    result = StockMovementOut.model_validate(movement)
    result.product_name = product.name
    result.product_category = product.category
    result.user_name = current_user.username

    if movement.supplier_id:
        supplier = db.query(Supplier).filter(Supplier.id == movement.supplier_id).first()
        if supplier:
            result.supplier_name = supplier.name

    if movement.branch_id:
        branch = db.query(Branch).filter(Branch.id == movement.branch_id).first()
        if branch:
            result.branch_name = branch.name

    return result


@router.get("/movements", response_model=List[StockMovementOut])
def list_stock_movements(
    limit: int = 100,
    offset: int = 0,
    product_id: int | None = None,
    current_user: User = Depends(require_admin),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    List stock movements with optional filtering by product.
    Returns movements ordered by most recent first.
    Admin only.
    """
    query = db.query(StockMovement)

    if product_id:
        query = query.filter(StockMovement.product_id == product_id)

    # Filter by branch if specified
    if branch_id is not None:
        query = query.filter(StockMovement.branch_id == branch_id)

    movements = (
        query
        .order_by(StockMovement.created_at.desc())
        .offset(offset)
        .limit(limit)
        .all()
    )

    # Enrich with product and user data
    results = []
    for movement in movements:
        result = StockMovementOut.model_validate(movement)

        product = db.query(Product).filter(Product.id == movement.product_id).first()
        if product:
            result.product_name = product.name
            result.product_category = product.category

        if movement.user_id:
            user = db.query(User).filter(User.id == movement.user_id).first()
            if user:
                result.user_name = user.username

        if movement.supplier_id:
            supplier = db.query(Supplier).filter(Supplier.id == movement.supplier_id).first()
            if supplier:
                result.supplier_name = supplier.name

        if movement.branch_id:
            branch = db.query(Branch).filter(Branch.id == movement.branch_id).first()
            if branch:
                result.branch_name = branch.name

        results.append(result)

    return results


@router.get("/levels", response_model=List[ProductStockOut])
def get_stock_levels(
    current_user: User = Depends(require_admin),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    Get current stock levels for all products in the current branch.
    Admin only.
    """
    if branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Se requiere especificar una sucursal para ver los niveles de stock"
        )

    products = db.query(Product).filter(Product.is_active == True).all()

    results = []
    for product in products:
        # Get branch stock or default to 0
        branch_stock = db.query(BranchStock).filter(
            BranchStock.branch_id == branch_id,
            BranchStock.product_id == product.id
        ).first()

        current_stock = branch_stock.stock_qty if branch_stock else 0
        min_stock = branch_stock.min_stock if branch_stock else 10

        results.append(
            ProductStockOut(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                variant=product.variant,
                current_stock=current_stock,
                min_stock=min_stock
            )
        )

    return results


@router.get("/product/{product_id}", response_model=ProductStockOut)
def get_product_stock(
    product_id: int,
    current_user: User = Depends(require_admin),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    Get current stock level for a specific product in the current branch.
    Admin only.
    """
    if branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Se requiere especificar una sucursal"
        )

    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Get branch stock
    branch_stock = db.query(BranchStock).filter(
        BranchStock.branch_id == branch_id,
        BranchStock.product_id == product_id
    ).first()

    current_stock = branch_stock.stock_qty if branch_stock else 0
    min_stock = branch_stock.min_stock if branch_stock else 10

    return ProductStockOut(
        product_id=product.id,
        product_name=product.name,
        category=product.category,
        variant=product.variant,
        current_stock=current_stock,
        min_stock=min_stock
    )


@router.get("/reposition", response_model=List[ProductRepositionOut])
def get_reposition_needs(
    current_user: User = Depends(require_admin),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    """
    Get products that need reposition (stock below minimum) in the current branch.
    Returns products with current stock < min_stock, sorted by urgency (lowest stock first).
    Includes suggested supplier based on most recent purchase from that product.
    Admin only.
    """
    if branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Se requiere especificar una sucursal"
        )

    # Get all active products
    products = db.query(Product).filter(Product.is_active == True).all()

    reposition_list = []

    for product in products:
        # Get branch stock
        branch_stock = db.query(BranchStock).filter(
            BranchStock.branch_id == branch_id,
            BranchStock.product_id == product.id
        ).first()

        current_stock = branch_stock.stock_qty if branch_stock else 0
        min_stock = branch_stock.min_stock if branch_stock else 10

        # Only include products below minimum stock
        if current_stock < min_stock:
            units_needed = min_stock - current_stock

            # Try to find the most recent supplier for this product in this branch
            suggested_supplier_id = None
            suggested_supplier_name = None

            # Query most recent stock movement with supplier for this product in this branch
            recent_movement = (
                db.query(StockMovement)
                .filter(
                    StockMovement.product_id == product.id,
                    StockMovement.branch_id == branch_id,
                    StockMovement.movement_type == "entrada",
                    StockMovement.supplier_id.isnot(None)
                )
                .order_by(StockMovement.created_at.desc())
                .first()
            )

            if recent_movement and recent_movement.supplier_id:
                supplier = db.query(Supplier).filter(Supplier.id == recent_movement.supplier_id).first()
                if supplier:
                    suggested_supplier_id = supplier.id
                    suggested_supplier_name = supplier.name

            reposition_list.append(
                ProductRepositionOut(
                    product_id=product.id,
                    product_name=product.name,
                    category=product.category,
                    variant=product.variant,
                    current_stock=current_stock,
                    min_stock=min_stock,
                    units_needed=units_needed,
                    suggested_supplier_id=suggested_supplier_id,
                    suggested_supplier_name=suggested_supplier_name
                )
            )

    # Sort by units_needed descending (most urgent first)
    reposition_list.sort(key=lambda x: x.units_needed, reverse=True)

    return reposition_list
