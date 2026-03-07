from fastapi import APIRouter, Depends, HTTPException, Header
from sqlalchemy.orm import Session
from typing import Optional

from app.core.database import get_db
from app.core.auth import get_current_user, get_branch_context
from app.models.user import User
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.stock_movement import StockMovement
from app.models.branch_stock import BranchStock
from app.schemas.customer import CustomerCreate, CustomerOut
from app.schemas.pos import SaleCreate, SaleOut, AssignDeliveryPersonRequest
from app.models.delivery_person import DeliveryPerson


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
        db.flush()

    return branch_stock

router = APIRouter(prefix="/pos", tags=["pos"])


@router.get("/customers", response_model=list[CustomerOut])
def search_customers(
    q: str = "",
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    q = q.strip()
    query = db.query(Customer)
    if q:
        like = f"%{q}%"
        query = query.filter(
            (Customer.name.ilike(like)) |
            (Customer.phone.ilike(like)) |
            (Customer.email.ilike(like))
        )
    return query.order_by(Customer.id.desc()).limit(20).all()


@router.post("/customers", response_model=CustomerOut)
def create_customer(
    payload: CustomerCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    c = Customer(
        name=payload.name.strip(),
        phone=(payload.phone.strip() if payload.phone else None),
        email=(payload.email.strip() if payload.email else None),
        address=(payload.address.strip() if payload.address else None),
    )
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.post("/sales", response_model=SaleOut)
def create_sale(
    payload: SaleCreate,
    current_user: User = Depends(get_current_user),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must have at least 1 item")

    # Use branch_id from payload if provided, otherwise use context
    sale_branch_id = payload.branch_id or branch_id

    if sale_branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Se requiere especificar una sucursal para registrar la venta"
        )

    # Validar customer si viene
    if payload.customer_id is not None:
        exists = db.query(Customer.id).filter(Customer.id == payload.customer_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail="Customer not found")

    # Traer productos y validar stock en branch_stock
    product_ids = [i.product_id for i in payload.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    by_id = {p.id: p for p in products}

    # Pre-fetch or create branch stocks for validation
    branch_stocks = {}
    for it in payload.items:
        if it.qty <= 0:
            raise HTTPException(status_code=400, detail="Invalid qty")
        p = by_id.get(it.product_id)
        if not p:
            raise HTTPException(status_code=400, detail=f"Product not found: {it.product_id}")

        # Get or create branch stock for this product
        branch_stock = get_or_create_branch_stock(db, sale_branch_id, it.product_id)
        branch_stocks[it.product_id] = branch_stock

        if branch_stock.stock_qty < it.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Stock insuficiente para producto {p.id} ({p.name}). Stock={branch_stock.stock_qty}, requerido={it.qty}",
            )

    # Crear venta + items en transacción
    sale = Sale(
        customer_id=payload.customer_id,
        is_invoiced=payload.is_invoiced,
        payment_method=payload.payment_method,
        cashier=payload.cashier,
        is_delivery=payload.is_delivery,
        delivery_address=payload.delivery_address,
        branch_id=sale_branch_id,
        total_ars=0
    )
    db.add(sale)
    db.flush()  # obtiene sale.id

    total = 0
    for it in payload.items:
        p = by_id[it.product_id]
        branch_stock = branch_stocks[it.product_id]
        unit = p.price_ars
        line_total = unit * it.qty
        total += line_total

        # Registrar stock anterior
        previous_stock = branch_stock.stock_qty

        # descontar stock de branch_stock
        branch_stock.stock_qty -= it.qty

        # Crear movimiento de stock automático por la venta
        stock_movement = StockMovement(
            product_id=p.id,
            movement_type="salida",
            quantity=it.qty,
            reason=f"Venta #{sale.id}",
            previous_stock=previous_stock,
            new_stock=branch_stock.stock_qty,
            user_id=current_user.id,
            sale_id=sale.id,
            branch_id=sale_branch_id
        )
        db.add(stock_movement)

        db.add(
            SaleItem(
                sale_id=sale.id,
                product_id=p.id,
                qty=it.qty,
                unit_price_ars=unit,
                line_total_ars=line_total,
            )
        )

    sale.total_ars = total
    db.commit()
    db.refresh(sale)
    return sale


@router.get("/sales/recent", response_model=list[SaleOut])
def recent_sales(
    limit: int = 20,
    current_user: User = Depends(get_current_user),
    branch_id: Optional[int] = Depends(get_branch_context),
    db: Session = Depends(get_db)
):
    limit = max(1, min(limit, 100))
    query = db.query(Sale)

    # Filter by branch if not admin or if branch is specified
    if branch_id is not None:
        query = query.filter(Sale.branch_id == branch_id)

    return query.order_by(Sale.id.desc()).limit(limit).all()


@router.post("/sales/assign-delivery-person")
def assign_delivery_person(
    payload: AssignDeliveryPersonRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Assign a delivery person (cadete) to a sale.
    Only works for sales marked as delivery (is_delivery=True).
    """
    # Find the sale
    sale = db.query(Sale).filter(Sale.id == payload.sale_id).first()
    if not sale:
        raise HTTPException(status_code=404, detail="Venta no encontrada")

    # Verify it's a delivery sale
    if not sale.is_delivery:
        raise HTTPException(
            status_code=400,
            detail="Esta venta no está marcada como delivery"
        )

    # Verify delivery person exists
    delivery_person = db.query(DeliveryPerson).filter(
        DeliveryPerson.id == payload.delivery_person_id
    ).first()
    if not delivery_person:
        raise HTTPException(status_code=404, detail="Cadete no encontrado")

    # Assign the delivery person
    sale.delivery_person_id = payload.delivery_person_id
    db.commit()
    db.refresh(sale)

    return {
        "message": "Cadete asignado exitosamente",
        "sale_id": sale.id,
        "delivery_person_id": sale.delivery_person_id,
        "delivery_person_name": delivery_person.name
    }


@router.get("/predefined-cashiers")
def get_predefined_cashiers(current_user: User = Depends(get_current_user)):
    """
    Get the predefined list of cashiers for selection in POS.
    """
    return {
        "cashiers": ["Micaela", "Roberto", "Laura"]
    }
