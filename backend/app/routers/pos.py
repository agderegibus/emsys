from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.product import Product
from app.models.customer import Customer
from app.models.sale import Sale, SaleItem
from app.models.stock_movement import StockMovement
from app.schemas.customer import CustomerCreate, CustomerOut
from app.schemas.pos import SaleCreate, SaleOut, AssignDeliveryPersonRequest
from app.models.delivery_person import DeliveryPerson

router = APIRouter(prefix="/pos", tags=["pos"])


@router.get("/customers", response_model=list[CustomerOut])
def search_customers(q: str = "", db: Session = Depends(get_db)):
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
def create_customer(payload: CustomerCreate, db: Session = Depends(get_db)):
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
def create_sale(payload: SaleCreate, db: Session = Depends(get_db)):
    if not payload.items:
        raise HTTPException(status_code=400, detail="Sale must have at least 1 item")

    # Validar customer si viene
    if payload.customer_id is not None:
        exists = db.query(Customer.id).filter(Customer.id == payload.customer_id).first()
        if not exists:
            raise HTTPException(status_code=400, detail="Customer not found")

    # Traer productos y validar stock
    product_ids = [i.product_id for i in payload.items]
    products = db.query(Product).filter(Product.id.in_(product_ids)).all()
    by_id = {p.id: p for p in products}

    for it in payload.items:
        if it.qty <= 0:
            raise HTTPException(status_code=400, detail="Invalid qty")
        p = by_id.get(it.product_id)
        if not p:
            raise HTTPException(status_code=400, detail=f"Product not found: {it.product_id}")
        if p.stock_qty < it.qty:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for product {p.id} ({p.name}). Stock={p.stock_qty}, required={it.qty}",
            )

    # Crear venta + items en transacción
    sale = Sale(
        customer_id=payload.customer_id,
        is_invoiced=payload.is_invoiced,
        payment_method=payload.payment_method,
        cashier=payload.cashier,
        is_delivery=payload.is_delivery,
        delivery_address=payload.delivery_address,
        total_ars=0
    )
    db.add(sale)
    db.flush()  # obtiene sale.id

    total = 0
    for it in payload.items:
        p = by_id[it.product_id]
        unit = p.price_ars
        line_total = unit * it.qty
        total += line_total

        # Registrar stock anterior
        previous_stock = p.stock_qty

        # descontar stock
        p.stock_qty -= it.qty

        # Crear movimiento de stock automático por la venta
        stock_movement = StockMovement(
            product_id=p.id,
            movement_type="salida",
            quantity=it.qty,
            reason=f"Venta #{sale.id}",
            previous_stock=previous_stock,
            new_stock=p.stock_qty,
            user_id=None,  # Could be set from authentication
            sale_id=sale.id
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
def recent_sales(limit: int = 20, db: Session = Depends(get_db)):
    limit = max(1, min(limit, 100))
    return db.query(Sale).order_by(Sale.id.desc()).limit(limit).all()


@router.post("/sales/assign-delivery-person")
def assign_delivery_person(payload: AssignDeliveryPersonRequest, db: Session = Depends(get_db)):
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
def get_predefined_cashiers():
    """
    Get the predefined list of cashiers for selection in POS.
    """
    return {
        "cashiers": ["Micaela", "Roberto", "Laura"]
    }
