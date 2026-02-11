from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.routers.product import router as product_router

from app.routers.user import router as user_router

app = FastAPI(title="Empanadas System")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.include_router(user_router)
app.include_router(product_router)

from app.routers.pos import router as pos_router
app.include_router(pos_router)

from app.routers.stock import router as stock_router
app.include_router(stock_router)

from app.routers.analytics import router as analytics_router
app.include_router(analytics_router)

from app.routers.customer import router as customer_router
app.include_router(customer_router)

from app.routers.supplier import router as supplier_router
app.include_router(supplier_router)

from app.routers.delivery_person import router as delivery_person_router
app.include_router(delivery_person_router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
