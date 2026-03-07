"""
Script to create dummy customers for testing
"""

import sys
sys.stdout.reconfigure(encoding='utf-8')

from app.core.database import SessionLocal
from app.models.customer import Customer
from datetime import datetime, timedelta
import random

# Datos dummy
nombres = [
    "Juan Pérez", "María González", "Carlos Rodríguez", "Ana Martínez",
    "Luis Fernández", "Laura García", "Jorge López", "Carmen Sánchez",
    "Miguel Ramírez", "Elena Torres", "Pedro Flores", "Lucía Morales",
    "Roberto Castro", "Patricia Ruiz", "Diego Ortiz", "Sofía Vargas",
    "Fernando Méndez", "Isabel Romero", "Andrés Silva", "Gabriela Navarro"
]

calles = [
    "Av. Corrientes", "Av. Libertador", "Av. Santa Fe", "Av. Rivadavia",
    "Av. Cabildo", "Av. Córdoba", "Av. de Mayo", "Av. Callao",
    "Av. Las Heras", "Av. Belgrano", "Calle Florida", "Calle Lavalle"
]

def create_dummy_customers():
    db = SessionLocal()
    try:
        # Check if customers already exist
        existing_count = db.query(Customer).count()
        if existing_count >= 20:
            print(f"Ya existen {existing_count} clientes. No se crearán más.")
            return

        print("Creando clientes dummy...")

        for i, nombre in enumerate(nombres, 1):
            # Generate random data
            phone = f"+54 11 {random.randint(1000, 9999)}-{random.randint(1000, 9999)}"
            email = nombre.lower().replace(" ", ".") + "@example.com"
            calle = random.choice(calles)
            numero = random.randint(100, 9999)
            piso = random.randint(1, 20)
            depto = random.choice(["A", "B", "C", "D", "E", "F"])
            address = f"{calle} {numero}, {piso}° {depto}, CABA"

            # Random creation date in the last 6 months
            days_ago = random.randint(0, 180)
            created_at = datetime.utcnow() - timedelta(days=days_ago)

            customer = Customer(
                name=nombre,
                phone=phone,
                email=email,
                address=address,
                created_at=created_at
            )
            db.add(customer)

        db.commit()
        print(f"✅ Se crearon {len(nombres)} clientes dummy exitosamente")

        # Show some examples
        customers = db.query(Customer).limit(5).all()
        print("\nEjemplos de clientes creados:")
        for c in customers:
            print(f"  - {c.name} ({c.email}) - {c.phone}")

    except Exception as e:
        print(f"❌ Error al crear clientes: {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    create_dummy_customers()
