import csv
import requests

API = "http://127.0.0.1:8000"

def to_int_price(value: str) -> int:
    v = value.strip()
    if not v:
        return 0
    return int(float(v))

def clean(s: str | None) -> str | None:
    if s is None:
        return None
    s = s.strip()
    return s if s else None

def main():
    path = "productos.csv"
    created = 0
    skipped = 0

    with open(path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for i, row in enumerate(reader, start=1):
            payload = {
                "category": clean(row.get("category")) or "Sin categoría",
                "subcategory": clean(row.get("subcategory")),
                "name": clean(row.get("name")) or "Sin nombre",
                "variant": clean(row.get("variant")),
                "price_ars": to_int_price(row.get("price_ars") or "0"),
                "description": clean(row.get("description")),
                "is_active": (row.get("is_active") or "true").strip().lower() == "true",
            }

            # regla simple: si price <= 0, salteamos (evita basura)
            if payload["price_ars"] <= 0:
                print(f"[{i}] SKIP price_ars <= 0 -> {payload['name']}")
                skipped += 1
                continue

            r = requests.post(f"{API}/products", json=payload, timeout=30)
            if r.status_code >= 300:
                print(f"[{i}] ERROR {r.status_code} -> {payload['name']} | {r.text}")
                skipped += 1
                continue

            created += 1
            if created % 20 == 0:
                print(f"✅ {created} creados...")

    print(f"\nDONE ✅ created={created} skipped={skipped}")

if __name__ == "__main__":
    main()
