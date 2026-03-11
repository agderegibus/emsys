from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.routers.auth import router as auth_router
from app.routers.branch import router as branch_router
from app.routers.product import router as product_router
from app.routers.user import router as user_router
from app.routers.pos import router as pos_router
from app.routers.stock import router as stock_router
from app.routers.analytics import router as analytics_router
from app.routers.customer import router as customer_router
from app.routers.supplier import router as supplier_router
from app.routers.delivery_person import router as delivery_person_router

app = FastAPI(title="Empanadas System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.get_cors_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Auth routes (no auth required for login)
app.include_router(auth_router)

# Branch routes
app.include_router(branch_router)

# User routes (admin only)
app.include_router(user_router)

# Product routes
app.include_router(product_router)

# POS routes
app.include_router(pos_router)

# Stock routes (admin only)
app.include_router(stock_router)

# Analytics routes
app.include_router(analytics_router)

# Customer routes
app.include_router(customer_router)

# Supplier routes
app.include_router(supplier_router)

# Delivery person routes
app.include_router(delivery_person_router)


@app.get("/health")
def health_check():
    return {"status": "ok"}
