from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, case
from typing import List
from datetime import datetime, timedelta

from app.core.database import get_db
from app.core.auth import require_admin, get_branch_context
from app.models.user import User
from app.models.delivery_person import DeliveryPerson
from app.models.sale import Sale
from app.schemas.delivery_person import DeliveryPersonCreate, DeliveryPersonOut

router = APIRouter(prefix="/delivery-persons", tags=["delivery-persons"])


@router.get("/", response_model=List[DeliveryPersonOut])
def list_delivery_persons(
    db: Session = Depends(get_db),
    active_only: bool = True,
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    List all delivery persons (cadetes) for the current branch.
    """
    query = db.query(DeliveryPerson)
    if active_only:
        query = query.filter(DeliveryPerson.is_active == True)
    if branch_id is not None:
        query = query.filter(DeliveryPerson.branch_id == branch_id)

    return query.all()


@router.get("/{delivery_person_id}/deliveries", response_model=List[dict])
def get_delivery_person_deliveries(
    delivery_person_id: int,
    db: Session = Depends(get_db),
    date: str | None = None,  # Format: YYYY-MM-DD
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get all deliveries assigned to a specific delivery person.
    Optionally filter by date.
    """
    dp_query = db.query(DeliveryPerson).filter(DeliveryPerson.id == delivery_person_id)
    if branch_id is not None:
        dp_query = dp_query.filter(DeliveryPerson.branch_id == branch_id)
    delivery_person = dp_query.first()

    if not delivery_person:
        raise HTTPException(status_code=404, detail="Cadete no encontrado")

    query = db.query(Sale).filter(
        Sale.delivery_person_id == delivery_person_id,
        Sale.is_delivery == True
    )
    if branch_id is not None:
        query = query.filter(Sale.branch_id == branch_id)

    # Filter by date if provided
    if date:
        try:
            target_date = datetime.strptime(date, "%Y-%m-%d")
            start_of_day = datetime.combine(target_date, datetime.min.time())
            end_of_day = datetime.combine(target_date, datetime.max.time())
            query = query.filter(
                Sale.created_at >= start_of_day,
                Sale.created_at <= end_of_day
            )
        except ValueError:
            raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    deliveries = query.order_by(Sale.created_at.desc()).all()

    return [
        {
            "id": sale.id,
            "created_at": sale.created_at,
            "total_ars": sale.total_ars,
            "payment_method": sale.payment_method,
            "delivery_address": sale.delivery_address,
            "is_invoiced": sale.is_invoiced
        }
        for sale in deliveries
    ]


@router.get("/{delivery_person_id}/stats", response_model=dict)
def get_delivery_person_stats(
    delivery_person_id: int,
    db: Session = Depends(get_db),
    date: str | None = None,  # Format: YYYY-MM-DD
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get statistics for a delivery person (total deliveries and amounts by payment method).
    Cash amount represents what the delivery person must turn in.
    Defaults to today's stats if no date provided.
    """
    dp_query = db.query(DeliveryPerson).filter(DeliveryPerson.id == delivery_person_id)
    if branch_id is not None:
        dp_query = dp_query.filter(DeliveryPerson.branch_id == branch_id)
    delivery_person = dp_query.first()

    if not delivery_person:
        raise HTTPException(status_code=404, detail="Cadete no encontrado")

    # Default to today
    if not date:
        date = datetime.now().strftime("%Y-%m-%d")

    try:
        target_date = datetime.strptime(date, "%Y-%m-%d")
        start_of_day = datetime.combine(target_date, datetime.min.time())
        end_of_day = datetime.combine(target_date, datetime.max.time())
    except ValueError:
        raise HTTPException(status_code=400, detail="Formato de fecha inválido. Use YYYY-MM-DD")

    # Get stats with breakdown by payment method
    stats_query = db.query(
        func.count(Sale.id).label("total_deliveries"),
        func.coalesce(func.sum(Sale.total_ars), 0).label("total_amount"),
        func.coalesce(
            func.sum(case((Sale.payment_method == "efectivo", Sale.total_ars), else_=0)),
            0
        ).label("cash_amount"),
        func.coalesce(
            func.sum(case((Sale.payment_method == "tarjeta", Sale.total_ars), else_=0)),
            0
        ).label("card_amount"),
        func.coalesce(
            func.sum(case((Sale.payment_method == "mercadopago", Sale.total_ars), else_=0)),
            0
        ).label("mercadopago_amount")
    ).filter(
        Sale.delivery_person_id == delivery_person_id,
        Sale.is_delivery == True,
        Sale.created_at >= start_of_day,
        Sale.created_at <= end_of_day
    )
    if branch_id is not None:
        stats_query = stats_query.filter(Sale.branch_id == branch_id)
    stats = stats_query.first()

    return {
        "delivery_person_id": delivery_person_id,
        "delivery_person_name": delivery_person.name,
        "date": date,
        "total_deliveries": stats.total_deliveries or 0,
        "total_amount": int(stats.total_amount) or 0,
        "cash_amount": int(stats.cash_amount) or 0,  # Lo que debe rendir
        "card_amount": int(stats.card_amount) or 0,
        "mercadopago_amount": int(stats.mercadopago_amount) or 0
    }


@router.post("/", response_model=DeliveryPersonOut)
def create_delivery_person(
    payload: DeliveryPersonCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Create a new delivery person (cadete) for the current branch.
    """
    if branch_id is None:
        raise HTTPException(
            status_code=400,
            detail="Branch context required to create delivery person"
        )
    delivery_person = DeliveryPerson(**payload.dict(), branch_id=branch_id)
    db.add(delivery_person)
    db.commit()
    db.refresh(delivery_person)
    return delivery_person
