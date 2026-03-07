#!/usr/bin/env python3
"""
Script to migrate all existing data to Mendoza branch.
"""

import sys
sys.path.insert(0, '.')

from app.core.database import SessionLocal
from app.models.branch import Branch
from app.models.product import Product
from app.models.sale import Sale
from app.models.stock_movement import StockMovement
from app.models.delivery_person import DeliveryPerson
from app.models.branch_stock import BranchStock


def migrate_to_mendoza():
    db = SessionLocal()

    try:
        # Find Mendoza branch
        mendoza = db.query(Branch).filter(Branch.code == "MZA").first()
        if not mendoza:
            print("ERROR: Mendoza branch not found!")
            return

        print(f"Found Mendoza branch: ID={mendoza.id}, Name={mendoza.name}")

        # Update sales without branch_id
        sales_updated = db.query(Sale).filter(Sale.branch_id == None).update(
            {"branch_id": mendoza.id},
            synchronize_session=False
        )
        print(f"Updated {sales_updated} sales to Mendoza")

        # Update stock_movements without branch_id
        movements_updated = db.query(StockMovement).filter(StockMovement.branch_id == None).update(
            {"branch_id": mendoza.id},
            synchronize_session=False
        )
        print(f"Updated {movements_updated} stock movements to Mendoza")

        # Update delivery_persons without branch_id
        delivery_updated = db.query(DeliveryPerson).filter(DeliveryPerson.branch_id == None).update(
            {"branch_id": mendoza.id},
            synchronize_session=False
        )
        print(f"Updated {delivery_updated} delivery persons to Mendoza")

        # Migrate product stock_qty to branch_stock for Mendoza
        products = db.query(Product).all()
        stock_created = 0
        stock_updated = 0

        for product in products:
            # Check if branch_stock already exists
            existing = db.query(BranchStock).filter(
                BranchStock.branch_id == mendoza.id,
                BranchStock.product_id == product.id
            ).first()

            if existing:
                # Update existing branch_stock with product's current stock_qty
                if existing.stock_qty == 0 and product.stock_qty > 0:
                    existing.stock_qty = product.stock_qty
                    stock_updated += 1
            else:
                # Create new branch_stock entry
                branch_stock = BranchStock(
                    branch_id=mendoza.id,
                    product_id=product.id,
                    stock_qty=product.stock_qty,
                    min_stock=10
                )
                db.add(branch_stock)
                stock_created += 1

        print(f"Created {stock_created} branch_stock entries for Mendoza")
        print(f"Updated {stock_updated} existing branch_stock entries")

        db.commit()
        print("\nMigration completed successfully!")

        # Show summary
        print("\n--- Summary ---")
        for branch in db.query(Branch).all():
            sales_count = db.query(Sale).filter(Sale.branch_id == branch.id).count()
            movements_count = db.query(StockMovement).filter(StockMovement.branch_id == branch.id).count()
            delivery_count = db.query(DeliveryPerson).filter(DeliveryPerson.branch_id == branch.id).count()
            stock_count = db.query(BranchStock).filter(BranchStock.branch_id == branch.id).count()
            print(f"{branch.name} ({branch.code}): {sales_count} sales, {movements_count} movements, {delivery_count} delivery persons, {stock_count} stock entries")

    except Exception as e:
        db.rollback()
        print(f"Error: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    migrate_to_mendoza()
