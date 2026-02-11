from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import select
from typing import List

from app.core.database import get_db
from app.models.stock_movement import StockMovement
from app.models.product import Product
from app.models.user import User
from app.models.supplier import Supplier
from app.schemas.stock import StockMovementCreate, StockMovementOut, ProductStockOut, ProductRepositionOut

router = APIRouter(prefix="/stock", tags=["stock"])


@router.post("/movements", response_model=StockMovementOut)
def create_stock_movement(
    payload: StockMovementCreate,
    db: Session = Depends(get_db)
):
    """
    Create a new stock movement (entrada, salida, or ajuste).
    Automatically updates the product's stock_qty.
    """
    # Verify product exists
    product = db.query(Product).filter(Product.id == payload.product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    # Get current stock (default to 0 if not set)
    current_stock = getattr(product, 'stock_qty', 0) or 0
    previous_stock = current_stock

    # Calculate new stock based on movement type
    if payload.movement_type == "entrada":
        new_stock = current_stock + payload.quantity
    elif payload.movement_type == "salida":
        new_stock = max(0, current_stock - payload.quantity)
        if current_stock < payload.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente. Stock actual: {current_stock}, intentando dar de baja: {payload.quantity}"
            )
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
        user_id=payload.user_id,
        sale_id=payload.sale_id,
        supplier_id=payload.supplier_id,
        purchase_price_ars=payload.purchase_price_ars
    )

    db.add(movement)

    # Update product stock
    product.stock_qty = new_stock

    db.commit()
    db.refresh(movement)

    # Add joined fields for response
    result = StockMovementOut.model_validate(movement)
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

    return result


@router.get("/movements", response_model=List[StockMovementOut])
def list_stock_movements(
    limit: int = 100,
    offset: int = 0,
    product_id: int | None = None,
    db: Session = Depends(get_db)
):
    """
    List stock movements with optional filtering by product.
    Returns movements ordered by most recent first.
    """
    query = db.query(StockMovement)

    if product_id:
        query = query.filter(StockMovement.product_id == product_id)

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

        results.append(result)

    return results


@router.get("/levels", response_model=List[ProductStockOut])
def get_stock_levels(db: Session = Depends(get_db)):
    """
    Get current stock levels for all products.
    """
    products = db.query(Product).filter(Product.is_active == True).all()

    results = []
    for product in products:
        results.append(
            ProductStockOut(
                product_id=product.id,
                product_name=product.name,
                category=product.category,
                variant=product.variant,
                current_stock=getattr(product, 'stock_qty', 0) or 0,
                min_stock=10  # Default min stock, could be configured per product
            )
        )

    return results


@router.get("/product/{product_id}", response_model=ProductStockOut)
def get_product_stock(product_id: int, db: Session = Depends(get_db)):
    """
    Get current stock level for a specific product.
    """
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Producto no encontrado")

    return ProductStockOut(
        product_id=product.id,
        product_name=product.name,
        category=product.category,
        variant=product.variant,
        current_stock=getattr(product, 'stock_qty', 0) or 0,
        min_stock=10
    )


@router.get("/reposition", response_model=List[ProductRepositionOut])
def get_reposition_needs(db: Session = Depends(get_db)):
    """
    Get products that need reposition (stock below minimum).
    Returns products with current stock < min_stock, sorted by urgency (lowest stock first).
    Includes suggested supplier based on most recent purchase from that product.
    """
    MIN_STOCK_DEFAULT = 10

    # Get all active products
    products = db.query(Product).filter(Product.is_active == True).all()

    reposition_list = []

    for product in products:
        current_stock = getattr(product, 'stock_qty', 0) or 0
        min_stock = MIN_STOCK_DEFAULT  # Could be made configurable per product in the future

        # Only include products below minimum stock
        if current_stock < min_stock:
            units_needed = min_stock - current_stock

            # Try to find the most recent supplier for this product
            suggested_supplier_id = None
            suggested_supplier_name = None

            # Query most recent stock movement with supplier for this product
            recent_movement = (
                db.query(StockMovement)
                .filter(
                    StockMovement.product_id == product.id,
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
