#!/usr/bin/env python3
"""
Script de setup completo para la base de datos.
Crea todas las tablas y datos iniciales necesarios para el sistema.

Uso:
    python setup_database.py

Opciones de entorno:
    DATABASE_URL: URL de conexión a PostgreSQL
    ADMIN_PASSWORD: Password para el usuario admin (default: admin123)
"""

import sys
import os
sys.path.insert(0, '.')

from datetime import datetime
from passlib.context import CryptContext

# Setup password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def run_migrations():
    """Ejecutar todas las migraciones de Alembic."""
    print("=" * 50)
    print("PASO 1: Ejecutando migraciones de base de datos...")
    print("=" * 50)

    import subprocess
    result = subprocess.run(
        ["python", "-m", "alembic", "upgrade", "head"],
        capture_output=True,
        text=True
    )

    if result.returncode != 0:
        print(f"Error en migraciones: {result.stderr}")
        # Try alternative command
        result = subprocess.run(
            ["alembic", "upgrade", "head"],
            capture_output=True,
            text=True
        )
        if result.returncode != 0:
            print(f"Error: {result.stderr}")
            return False

    print(result.stdout)
    print("Migraciones completadas.\n")
    return True


def create_branches(db):
    """Crear las sucursales iniciales."""
    from app.models.branch import Branch

    print("=" * 50)
    print("PASO 2: Creando sucursales...")
    print("=" * 50)

    branches_data = [
        {"name": "Mendoza", "code": "MZA", "address": "Av. San Martín 1234, Mendoza", "phone": "261-4001234"},
        {"name": "Pergamino", "code": "PER", "address": "Av. de Mayo 567, Pergamino", "phone": "2477-401234"},
        {"name": "Lagos", "code": "LAG", "address": "Calle Principal 890, Lagos", "phone": "2474-451234"},
    ]

    created = 0
    for branch_data in branches_data:
        existing = db.query(Branch).filter(Branch.code == branch_data["code"]).first()
        if not existing:
            branch = Branch(**branch_data)
            db.add(branch)
            created += 1
            print(f"  + Creada sucursal: {branch_data['name']} ({branch_data['code']})")
        else:
            print(f"  - Sucursal ya existe: {branch_data['name']} ({branch_data['code']})")

    db.commit()
    print(f"Sucursales: {created} creadas.\n")
    return True


def create_admin_user(db):
    """Crear el usuario administrador."""
    from app.models.user import User
    from app.models.branch import Branch
    from app.models.user_branch import UserBranch

    print("=" * 50)
    print("PASO 3: Creando usuario administrador...")
    print("=" * 50)

    # Check if admin exists
    existing = db.query(User).filter(User.username == "admin").first()
    if existing:
        print("  - Usuario admin ya existe.")
        return True

    # Get password from env or use default
    admin_password = os.environ.get("ADMIN_PASSWORD", "admin123")

    # Create admin user
    admin = User(
        username="admin",
        email="admin@empanadas.com",
        password_hash=pwd_context.hash(admin_password),
        role="admin",
        is_active=True
    )
    db.add(admin)
    db.flush()

    # Assign admin to all branches
    branches = db.query(Branch).all()
    for i, branch in enumerate(branches):
        user_branch = UserBranch(
            user_id=admin.id,
            branch_id=branch.id,
            is_default=(i == 0)  # First branch is default
        )
        db.add(user_branch)

    db.commit()
    print(f"  + Usuario admin creado (password: {admin_password})")
    print(f"  + Asignado a {len(branches)} sucursales.\n")
    return True


def create_sample_products(db):
    """Crear productos de ejemplo."""
    from app.models.product import Product

    print("=" * 50)
    print("PASO 4: Verificando productos...")
    print("=" * 50)

    existing_count = db.query(Product).count()
    if existing_count > 0:
        print(f"  - Ya existen {existing_count} productos en la base de datos.\n")
        return True

    # Sample products
    products_data = [
        {"category": "Empanadas", "subcategory": "Tradicionales", "name": "Empanada de Carne", "variant": "Suave", "price_ars": 800, "stock_qty": 50},
        {"category": "Empanadas", "subcategory": "Tradicionales", "name": "Empanada de Carne", "variant": "Picante", "price_ars": 800, "stock_qty": 50},
        {"category": "Empanadas", "subcategory": "Tradicionales", "name": "Empanada de Pollo", "variant": None, "price_ars": 800, "stock_qty": 50},
        {"category": "Empanadas", "subcategory": "Tradicionales", "name": "Empanada de Jamón y Queso", "variant": None, "price_ars": 800, "stock_qty": 50},
        {"category": "Empanadas", "subcategory": "Tradicionales", "name": "Empanada de Humita", "variant": None, "price_ars": 800, "stock_qty": 50},
        {"category": "Empanadas", "subcategory": "Especiales", "name": "Empanada de Carne Cortada a Cuchillo", "variant": None, "price_ars": 1200, "stock_qty": 30},
        {"category": "Empanadas", "subcategory": "Especiales", "name": "Empanada de Verdura", "variant": None, "price_ars": 900, "stock_qty": 40},
        {"category": "Empanadas", "subcategory": "Especiales", "name": "Empanada Caprese", "variant": None, "price_ars": 1000, "stock_qty": 30},
        {"category": "Bebidas", "subcategory": "Gaseosas", "name": "Coca-Cola", "variant": "500ml", "price_ars": 1500, "stock_qty": 100},
        {"category": "Bebidas", "subcategory": "Gaseosas", "name": "Sprite", "variant": "500ml", "price_ars": 1500, "stock_qty": 80},
        {"category": "Bebidas", "subcategory": "Agua", "name": "Agua Mineral", "variant": "500ml", "price_ars": 800, "stock_qty": 100},
        {"category": "Postres", "subcategory": "Dulces", "name": "Pastelito de Membrillo", "variant": None, "price_ars": 600, "stock_qty": 40},
        {"category": "Postres", "subcategory": "Dulces", "name": "Pastelito de Batata", "variant": None, "price_ars": 600, "stock_qty": 40},
    ]

    for product_data in products_data:
        product = Product(**product_data)
        db.add(product)

    db.commit()
    print(f"  + Creados {len(products_data)} productos de ejemplo.\n")
    return True


def create_branch_stock(db):
    """Crear stock inicial para Mendoza con los productos existentes."""
    from app.models.product import Product
    from app.models.branch import Branch
    from app.models.branch_stock import BranchStock

    print("=" * 50)
    print("PASO 5: Configurando stock por sucursal...")
    print("=" * 50)

    # Get Mendoza branch
    mendoza = db.query(Branch).filter(Branch.code == "MZA").first()
    if not mendoza:
        print("  ! Sucursal Mendoza no encontrada.")
        return False

    products = db.query(Product).all()
    created = 0

    for product in products:
        existing = db.query(BranchStock).filter(
            BranchStock.branch_id == mendoza.id,
            BranchStock.product_id == product.id
        ).first()

        if not existing:
            branch_stock = BranchStock(
                branch_id=mendoza.id,
                product_id=product.id,
                stock_qty=product.stock_qty,
                min_stock=10
            )
            db.add(branch_stock)
            created += 1

    db.commit()
    print(f"  + Creados {created} registros de stock para Mendoza.\n")
    return True


def create_sample_suppliers(db):
    """Crear proveedores de ejemplo."""
    from app.models.supplier import Supplier

    print("=" * 50)
    print("PASO 6: Verificando proveedores...")
    print("=" * 50)

    existing_count = db.query(Supplier).count()
    if existing_count > 0:
        print(f"  - Ya existen {existing_count} proveedores.\n")
        return True

    suppliers_data = [
        {
            "name": "Distribuidora La Abundancia",
            "contact_name": "Carlos Rodríguez",
            "phone": "11-4555-1234",
            "email": "ventas@laabundancia.com.ar",
            "address": "Av. Corrientes 1234, CABA",
            "notes": "Proveedor de carnes y embutidos"
        },
        {
            "name": "Almacén Don Pepe",
            "contact_name": "José García",
            "phone": "11-4555-5678",
            "email": "pedidos@donpepe.com.ar",
            "address": "Calle Florida 567, CABA",
            "notes": "Verduras y productos frescos"
        },
        {
            "name": "Lácteos del Sur S.A.",
            "contact_name": "María López",
            "phone": "11-4555-9012",
            "email": "comercial@lacteosdelsur.com.ar",
            "address": "Av. Belgrano 890, CABA",
            "notes": "Quesos y productos lácteos"
        },
    ]

    for supplier_data in suppliers_data:
        supplier = Supplier(**supplier_data)
        db.add(supplier)

    db.commit()
    print(f"  + Creados {len(suppliers_data)} proveedores.\n")
    return True


def print_summary(db):
    """Imprimir resumen de la base de datos."""
    from app.models.branch import Branch
    from app.models.user import User
    from app.models.product import Product
    from app.models.supplier import Supplier
    from app.models.branch_stock import BranchStock

    print("=" * 50)
    print("RESUMEN DE LA BASE DE DATOS")
    print("=" * 50)

    branches = db.query(Branch).count()
    users = db.query(User).count()
    products = db.query(Product).count()
    suppliers = db.query(Supplier).count()
    branch_stocks = db.query(BranchStock).count()

    print(f"  Sucursales:     {branches}")
    print(f"  Usuarios:       {users}")
    print(f"  Productos:      {products}")
    print(f"  Proveedores:    {suppliers}")
    print(f"  Stock entries:  {branch_stocks}")
    print()

    print("Sucursales configuradas:")
    for branch in db.query(Branch).all():
        stock_count = db.query(BranchStock).filter(BranchStock.branch_id == branch.id).count()
        print(f"  - {branch.name} ({branch.code}): {stock_count} productos con stock")

    print()
    print("=" * 50)
    print("SETUP COMPLETADO EXITOSAMENTE")
    print("=" * 50)
    print()
    print("Credenciales de acceso:")
    print("  Usuario: admin")
    print(f"  Password: {os.environ.get('ADMIN_PASSWORD', 'admin123')}")
    print()


def main():
    print()
    print("=" * 50)
    print("  SETUP DE BASE DE DATOS - SISTEMA EMPANADAS")
    print("=" * 50)
    print()

    # Run migrations first
    if not run_migrations():
        print("ERROR: No se pudieron ejecutar las migraciones.")
        print("Asegúrate de que la base de datos esté accesible.")
        sys.exit(1)

    # Import after migrations
    from app.core.database import SessionLocal

    db = SessionLocal()

    try:
        create_branches(db)
        create_admin_user(db)
        create_sample_products(db)
        create_branch_stock(db)
        create_sample_suppliers(db)
        print_summary(db)

    except Exception as e:
        db.rollback()
        print(f"\nERROR: {e}")
        import traceback
        traceback.print_exc()
        sys.exit(1)
    finally:
        db.close()


if __name__ == "__main__":
    main()
