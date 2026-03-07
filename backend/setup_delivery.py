"""
Script to setup delivery functionality:
- Create Delivery product ($2000)
- Create dummy delivery persons (cadetes)
- Create predefined cashiers list
"""

from app.core.database import SessionLocal
from app.models.product import Product
from app.models.delivery_person import DeliveryPerson
from app.models.supplier import Supplier  # Import to resolve foreign key references
from app.models.sale import Sale  # Import to resolve foreign key references

def main():
    db = SessionLocal()
    try:
        # 1. Create Delivery product if it doesn't exist
        delivery_product = db.query(Product).filter(
            Product.name == "Delivery",
            Product.category == "Servicios"
        ).first()

        if not delivery_product:
            delivery_product = Product(
                category="Servicios",
                subcategory="Envío",
                name="Delivery",
                variant=None,
                price_ars=2000,
                description="Servicio de delivery a domicilio",
                is_active=True,
                stock_qty=9999  # High stock since it's a service
            )
            db.add(delivery_product)
            print("[ OK ] Producto 'Delivery' creado ($2000)")
        else:
            print("[ OK ] Producto 'Delivery' ya existe")

        # 2. Create dummy delivery persons (cadetes)
        cadetes_names = [
            ("Juan Pérez", "11-5555-1234"),
            ("María González", "11-5555-5678"),
            ("Carlos Rodríguez", "11-5555-9012")
        ]

        for name, phone in cadetes_names:
            existing = db.query(DeliveryPerson).filter(DeliveryPerson.name == name).first()
            if not existing:
                cadete = DeliveryPerson(
                    name=name,
                    phone=phone,
                    is_active=True
                )
                db.add(cadete)
                print(f"[ OK ] Cadete creado: {name}")
            else:
                print(f"[ OK ] Cadete ya existe: {name}")

        db.commit()
        print("\n[ OK ] Setup de delivery completado exitosamente!")

        # Display info about predefined cashiers
        print("\nCajeros predefinidos para el sistema:")
        predefined_cashiers = ["Micaela", "Roberto", "Laura"]
        for cashier in predefined_cashiers:
            print(f"  - {cashier}")

    except Exception as e:
        print(f"[ ERROR ] {e}")
        db.rollback()
    finally:
        db.close()


if __name__ == "__main__":
    main()
