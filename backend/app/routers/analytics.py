"""
Analytics and Business Intelligence router.
Provides aggregated sales data and metrics for dashboard visualization.
"""

from datetime import datetime, timedelta
from typing import Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import func, desc
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import require_admin, get_branch_context
from app.models.user import User
from app.models.sale import Sale, SaleItem
from app.models.product import Product
from app.models.stock_movement import StockMovement
from app.models.supplier import Supplier

router = APIRouter(prefix="/analytics", tags=["analytics"])


@router.get("/summary")
def get_analytics_summary(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get analytics summary with key metrics and aggregated data.

    Returns:
    - Total sales amount
    - Number of transactions
    - Average ticket
    - Top products
    - Sales by category
    - Sales by hour
    - Period comparison
    """
    # Parse dates or use today
    # We need to work with the date portion only to avoid timezone issues
    if start_date:
        # Parse the date string and set to start of day
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        # Get today's date at midnight
        today = datetime.now().date()
        start = datetime.combine(today, datetime.min.time())

    if end_date:
        # Parse the date string and set to end of day
        end = datetime.strptime(end_date, "%Y-%m-%d")
        end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        # Get today's date at 23:59:59
        today = datetime.now().date()
        end = datetime.combine(today, datetime.max.time())

    # Calculate previous period for comparison
    period_length = (end - start).days + 1
    prev_start = start - timedelta(days=period_length)
    prev_end = start - timedelta(seconds=1)

    # Current period sales
    current_query = db.query(Sale).filter(Sale.created_at >= start, Sale.created_at <= end)
    if branch_id is not None:
        current_query = current_query.filter(Sale.branch_id == branch_id)
    current_sales = current_query.all()

    # Previous period sales
    prev_query = db.query(Sale).filter(Sale.created_at >= prev_start, Sale.created_at <= prev_end)
    if branch_id is not None:
        prev_query = prev_query.filter(Sale.branch_id == branch_id)
    previous_sales = prev_query.all()

    # Calculate metrics
    total_sales = sum(s.total_ars for s in current_sales)
    total_transactions = len(current_sales)
    avg_ticket = total_sales / total_transactions if total_transactions > 0 else 0

    prev_total_sales = sum(s.total_ars for s in previous_sales)
    prev_total_transactions = len(previous_sales)
    prev_avg_ticket = prev_total_sales / prev_total_transactions if prev_total_transactions > 0 else 0

    # Calculate growth percentages
    sales_growth = ((total_sales - prev_total_sales) / prev_total_sales * 100) if prev_total_sales > 0 else 0
    transactions_growth = ((total_transactions - prev_total_transactions) / prev_total_transactions * 100) if prev_total_transactions > 0 else 0
    avg_ticket_growth = ((avg_ticket - prev_avg_ticket) / prev_avg_ticket * 100) if prev_avg_ticket > 0 else 0

    # Top products by quantity
    top_qty_query = (
        db.query(
            Product.id,
            Product.name,
            Product.variant,
            Product.category,
            func.sum(SaleItem.qty).label("total_qty"),
            func.sum(SaleItem.line_total_ars).label("total_revenue")
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.created_at >= start, Sale.created_at <= end)
    )
    if branch_id is not None:
        top_qty_query = top_qty_query.filter(Sale.branch_id == branch_id)
    top_products_qty = (
        top_qty_query
        .group_by(Product.id, Product.name, Product.variant, Product.category)
        .order_by(desc("total_qty"))
        .limit(10)
        .all()
    )

    # Top products by revenue
    top_rev_query = (
        db.query(
            Product.id,
            Product.name,
            Product.variant,
            Product.category,
            func.sum(SaleItem.qty).label("total_qty"),
            func.sum(SaleItem.line_total_ars).label("total_revenue")
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.created_at >= start, Sale.created_at <= end)
    )
    if branch_id is not None:
        top_rev_query = top_rev_query.filter(Sale.branch_id == branch_id)
    top_products_revenue = (
        top_rev_query
        .group_by(Product.id, Product.name, Product.variant, Product.category)
        .order_by(desc("total_revenue"))
        .limit(10)
        .all()
    )

    # Sales by category
    cat_query = (
        db.query(
            Product.category,
            func.sum(SaleItem.qty).label("total_qty"),
            func.sum(SaleItem.line_total_ars).label("total_revenue")
        )
        .join(SaleItem, SaleItem.product_id == Product.id)
        .join(Sale, Sale.id == SaleItem.sale_id)
        .filter(Sale.created_at >= start, Sale.created_at <= end)
    )
    if branch_id is not None:
        cat_query = cat_query.filter(Sale.branch_id == branch_id)
    sales_by_category = (
        cat_query
        .group_by(Product.category)
        .order_by(desc("total_revenue"))
        .all()
    )

    # Sales by hour
    sales_by_hour = {}
    for sale in current_sales:
        hour = sale.created_at.hour
        if hour not in sales_by_hour:
            sales_by_hour[hour] = {"transactions": 0, "total": 0}
        sales_by_hour[hour]["transactions"] += 1
        sales_by_hour[hour]["total"] += sale.total_ars

    # Convert to sorted list
    hourly_data = [
        {
            "hour": h,
            "transactions": sales_by_hour.get(h, {}).get("transactions", 0),
            "total": sales_by_hour.get(h, {}).get("total", 0)
        }
        for h in range(24)
    ]

    # Sales by day (for date range views)
    sales_by_day = {}
    for sale in current_sales:
        day = sale.created_at.date().isoformat()
        if day not in sales_by_day:
            sales_by_day[day] = {"transactions": 0, "total": 0}
        sales_by_day[day]["transactions"] += 1
        sales_by_day[day]["total"] += sale.total_ars

    daily_data = [
        {
            "date": day,
            "transactions": data["transactions"],
            "total": data["total"]
        }
        for day, data in sorted(sales_by_day.items())
    ]

    return {
        "period": {
            "start": start.isoformat(),
            "end": end.isoformat(),
            "days": period_length
        },
        "metrics": {
            "total_sales": total_sales,
            "total_transactions": total_transactions,
            "avg_ticket": avg_ticket,
            "sales_growth": round(sales_growth, 2),
            "transactions_growth": round(transactions_growth, 2),
            "avg_ticket_growth": round(avg_ticket_growth, 2)
        },
        "previous_period": {
            "total_sales": prev_total_sales,
            "total_transactions": prev_total_transactions,
            "avg_ticket": prev_avg_ticket
        },
        "top_products_by_quantity": [
            {
                "id": p.id,
                "name": p.name,
                "variant": p.variant,
                "category": p.category,
                "total_qty": p.total_qty,
                "total_revenue": p.total_revenue
            }
            for p in top_products_qty
        ],
        "top_products_by_revenue": [
            {
                "id": p.id,
                "name": p.name,
                "variant": p.variant,
                "category": p.category,
                "total_qty": p.total_qty,
                "total_revenue": p.total_revenue
            }
            for p in top_products_revenue
        ],
        "sales_by_category": [
            {
                "category": c.category,
                "total_qty": c.total_qty,
                "total_revenue": c.total_revenue
            }
            for c in sales_by_category
        ],
        "hourly_data": hourly_data,
        "daily_data": daily_data
    }


@router.get("/sales")
def get_filtered_sales(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    hour: Optional[int] = Query(None, description="Filter by specific hour (0-23)"),
    category: Optional[str] = Query(None, description="Filter by category"),
    product_id: Optional[int] = Query(None, description="Filter by product ID"),
    date: Optional[str] = Query(None, description="Filter by specific date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get sales filtered by various criteria.
    Returns full sale details including items.
    """
    query = db.query(Sale)

    # Filter by branch
    if branch_id is not None:
        query = query.filter(Sale.branch_id == branch_id)

    # Date range filter
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
        query = query.filter(Sale.created_at >= start)

    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
        end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Sale.created_at <= end)

    # Specific date filter
    if date:
        date_obj = datetime.strptime(date, "%Y-%m-%d")
        date_end = date_obj.replace(hour=23, minute=59, second=59, microsecond=999999)
        query = query.filter(Sale.created_at >= date_obj, Sale.created_at <= date_end)

    # Hour filter
    if hour is not None:
        query = query.filter(func.extract('hour', Sale.created_at) == hour)

    # Category filter - need to join with SaleItem and Product
    if category:
        query = (
            query.join(SaleItem, SaleItem.sale_id == Sale.id)
            .join(Product, Product.id == SaleItem.product_id)
            .filter(Product.category == category)
            .distinct()
        )

    # Product filter
    if product_id:
        query = (
            query.join(SaleItem, SaleItem.sale_id == Sale.id)
            .filter(SaleItem.product_id == product_id)
            .distinct()
        )

    sales = query.order_by(desc(Sale.created_at)).limit(100).all()

    return [
        {
            "id": sale.id,
            "created_at": sale.created_at.isoformat(),
            "customer_id": sale.customer_id,
            "is_invoiced": sale.is_invoiced,
            "total_ars": sale.total_ars,
            "items": [
                {
                    "product_id": item.product_id,
                    "qty": item.qty,
                    "unit_price_ars": item.unit_price_ars,
                    "line_total_ars": item.line_total_ars,
                }
                for item in sale.items
            ],
        }
        for sale in sales
    ]


@router.get("/suppliers")
def get_supplier_stats(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get supplier purchase statistics for a given period.
    Returns total purchases and total spent per supplier.
    """
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        today = datetime.now().date()
        start = datetime.combine(today, datetime.min.time())

    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
        end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        today = datetime.now().date()
        end = datetime.combine(today, datetime.max.time())

    # Query stock movements with suppliers
    supplier_query = (
        db.query(
            Supplier.id.label("supplier_id"),
            Supplier.name.label("supplier_name"),
            func.count(StockMovement.id).label("total_purchases"),
            func.sum(StockMovement.quantity * StockMovement.purchase_price_ars).label("total_spent")
        )
        .join(StockMovement, StockMovement.supplier_id == Supplier.id)
        .filter(
            StockMovement.created_at >= start,
            StockMovement.created_at <= end,
            StockMovement.movement_type == "entrada",
            StockMovement.purchase_price_ars.isnot(None)
        )
    )
    if branch_id is not None:
        supplier_query = supplier_query.filter(StockMovement.branch_id == branch_id)
    supplier_stats = (
        supplier_query
        .group_by(Supplier.id, Supplier.name)
        .order_by(desc("total_spent"))
        .all()
    )

    return [
        {
            "supplier_id": s.supplier_id,
            "supplier_name": s.supplier_name,
            "total_purchases": s.total_purchases,
            "total_spent": s.total_spent or 0
        }
        for s in supplier_stats
    ]


@router.get("/cashiers")
def get_cashier_stats(
    start_date: Optional[str] = Query(None, description="Start date (YYYY-MM-DD)"),
    end_date: Optional[str] = Query(None, description="End date (YYYY-MM-DD)"),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_admin),
    branch_id: int | None = Depends(get_branch_context),
):
    """
    Get cashier sales statistics for a given period.
    Returns total sales and amount per cashier with payment method breakdown.
    """
    # Parse dates
    if start_date:
        start = datetime.strptime(start_date, "%Y-%m-%d")
    else:
        today = datetime.now().date()
        start = datetime.combine(today, datetime.min.time())

    if end_date:
        end = datetime.strptime(end_date, "%Y-%m-%d")
        end = end.replace(hour=23, minute=59, second=59, microsecond=999999)
    else:
        today = datetime.now().date()
        end = datetime.combine(today, datetime.max.time())

    # Get all sales with cashiers
    cashier_query = (
        db.query(Sale)
        .filter(
            Sale.created_at >= start,
            Sale.created_at <= end,
            Sale.cashier.isnot(None)
        )
    )
    if branch_id is not None:
        cashier_query = cashier_query.filter(Sale.branch_id == branch_id)
    sales = cashier_query.all()

    # Group by cashier and calculate stats
    cashier_data = {}
    for sale in sales:
        cashier = sale.cashier
        if cashier not in cashier_data:
            cashier_data[cashier] = {
                "total_sales": 0,
                "total_amount": 0,
                "payment_methods": {
                    "efectivo": 0,
                    "tarjeta": 0,
                    "mercadopago": 0
                }
            }

        cashier_data[cashier]["total_sales"] += 1
        cashier_data[cashier]["total_amount"] += sale.total_ars

        # Track payment method amounts
        payment_method = sale.payment_method or "efectivo"  # default to efectivo if not specified
        if payment_method in cashier_data[cashier]["payment_methods"]:
            cashier_data[cashier]["payment_methods"][payment_method] += sale.total_ars

    # Convert to list and sort by total amount
    result = [
        {
            "cashier": cashier,
            "total_sales": data["total_sales"],
            "total_amount": data["total_amount"],
            "payment_methods": data["payment_methods"]
        }
        for cashier, data in cashier_data.items()
    ]

    # Sort by total amount descending
    result.sort(key=lambda x: x["total_amount"], reverse=True)

    return result
