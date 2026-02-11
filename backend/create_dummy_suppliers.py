"""
Script to create dummy suppliers for testing
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.core.database import SessionLocal
from app.models.supplier import Supplier
from datetime import datetime, timedelta
import random

# Datos dummy
suppliers_data = [
    {
        "name": "Distribuidora La Abundancia",
        "contact_name": "Carlos Méndez",
        "phone": "+54 11 4567-8901",
        "email": "ventas@laabundancia.com.ar",
        "address": "Av. Warnes 2345, CABA",
        "notes": "Proveedor principal de productos cárnicos"
    },
    {
        "name": "Almacén Don Pepe",
        "contact_name": "José González",
        "phone": "+54 11 4234-5678",
        "email": "compras@donpepe.com",
        "address": "Av. Corrientes 4567, CABA",
        "notes": "Verduras y productos frescos"
    },
    {
        "name": "Lácteos del Sur S.A.",
        "contact_name": "María Rodríguez",
        "phone": "+54 11 5678-1234",
        "email": "contacto@lacteosur.com.ar",
        "address": "Ruta 2 Km 45, Buenos Aires",
        "notes": "Quesos y productos lácteos premium"
    },
    {
        "name": "Panificadora Central",
        "contact_name": "Roberto Fernández",
        "phone": "+54 11 4890-1234",
        "email": "ventas@panificadora.com",
        "address": "Av. Rivadavia 8901, CABA",
        "notes": "Masa para empanadas y tapas"
    },
    {
        "name": "Especias y Condimentos S.R.L.",
        "contact_name": "Laura Martínez",
        "phone": "+54 11 4321-8765",
        "email": "info@especiasycondimentos.com",
        "address": "Av. Belgrano 3456, CABA",
        "notes": "Especias, condimentos y aderezos"
    },
]

def create_dummy_suppliers():
    db = SessionLocal()
    try:
        # Check if suppliers already exist
        existing_count = db.query(Supplier).count()
        if existing_count >= 5:
            print(f"Ya existen {existing_count} proveedores. No se crearán más.")
            return

        print("Creando proveedores dummy...")

        for supplier_data in suppliers_data:
            # Random creation date in the last year
            days_ago = random.randint(30, 365)
            created_at = datetime.utcnow() - timedelta(days=days_ago)

            supplier = Supplier(
                **supplier_data,
                created_at=created_at
            )
            db.add(supplier)

        db.commit()
        print(f"Se crearon {len(suppliers_data)} proveedores dummy exitosamente")

        # Show examples
        suppliers = db.query(Supplier).all()
        print("\nProveedores creados:")
        for s in suppliers:
            print(f"  - {s.name} ({s.contact_name}) - {s.email}")

    except Exception as e:
        print(f"Error al crear proveedores: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_dummy_suppliers()
