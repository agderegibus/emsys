"""
Customer management router.
Handles customer CRUD operations and customer-related queries.
"""

from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.customer import Customer
from app.models.sale import Sale
from app.schemas.customer import CustomerCreate, CustomerUpdate, CustomerOut, CustomerWithStats

router = APIRouter(prefix="/customers", tags=["customers"])


@router.post("", response_model=CustomerOut)
def create_customer(customer: CustomerCreate, db: Session = Depends(get_db)):
    """Create a new customer."""
    db_customer = Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.get("", response_model=list[CustomerOut])
def list_customers(
    q: Optional[str] = Query(None, description="Search by name, phone, or email"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List all customers with optional search."""
    query = db.query(Customer)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (Customer.name.ilike(search)) |
            (Customer.phone.ilike(search)) |
            (Customer.email.ilike(search))
        )

    customers = query.order_by(desc(Customer.created_at)).offset(skip).limit(limit).all()
    return customers


@router.get("/with-stats", response_model=list[CustomerWithStats])
def list_customers_with_stats(
    q: Optional[str] = Query(None, description="Search by name, phone, or email"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
):
    """List customers with purchase statistics."""
    query = db.query(Customer)

    if q:
        search = f"%{q}%"
        query = query.filter(
            (Customer.name.ilike(search)) |
            (Customer.phone.ilike(search)) |
            (Customer.email.ilike(search))
        )

    customers = query.order_by(desc(Customer.created_at)).offset(skip).limit(limit).all()

    result = []
    for customer in customers:
        # Get purchase statistics
        sales = db.query(Sale).filter(Sale.customer_id == customer.id).all()
        total_purchases = len(sales)
        total_spent = sum(s.total_ars for s in sales)
        last_purchase_date = max((s.created_at for s in sales), default=None)

        result.append(
            CustomerWithStats(
                id=customer.id,
                name=customer.name,
                phone=customer.phone,
                email=customer.email,
                address=customer.address,
                created_at=customer.created_at,
                total_purchases=total_purchases,
                total_spent=total_spent,
                last_purchase_date=last_purchase_date,
            )
        )

    return result


@router.get("/{customer_id}", response_model=CustomerOut)
def get_customer(customer_id: int, db: Session = Depends(get_db)):
    """Get a specific customer by ID."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


@router.get("/{customer_id}/sales")
def get_customer_sales(
    customer_id: int,
    limit: int = Query(10, description="Number of recent sales to return"),
    db: Session = Depends(get_db),
):
    """Get recent sales for a specific customer."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    sales = (
        db.query(Sale)
        .filter(Sale.customer_id == customer_id)
        .order_by(desc(Sale.created_at))
        .limit(limit)
        .all()
    )

    return {
        "customer": CustomerOut.model_validate(customer),
        "sales": [
            {
                "id": s.id,
                "created_at": s.created_at,
                "total_ars": s.total_ars,
                "is_invoiced": s.is_invoiced,
                "items_count": len(s.items),
            }
            for s in sales
        ],
        "total_purchases": len(sales),
        "total_spent": sum(s.total_ars for s in sales),
    }


@router.put("/{customer_id}", response_model=CustomerOut)
def update_customer(
    customer_id: int,
    customer_update: CustomerUpdate,
    db: Session = Depends(get_db),
):
    """Update a customer's information."""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = customer_update.model_dump(exclude_unset=True)
    for field, value in update_data.items():
        setattr(db_customer, field, value)

    db.commit()
    db.refresh(db_customer)
    return db_customer


@router.delete("/{customer_id}")
def delete_customer(customer_id: int, db: Session = Depends(get_db)):
    """Delete a customer."""
    db_customer = db.query(Customer).filter(Customer.id == customer_id).first()
    if not db_customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db.delete(db_customer)
    db.commit()
    return {"message": "Customer deleted successfully"}
