import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.core.config import settings
from app.routers import auth, tenants, plots, enquiries, bookings, emi, staff, customer_auth, uploads, support_tickets, payment_gateway, geocode, subscription_plans
from app.services.reminders import start_scheduler

import os
os.makedirs("uploads", exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
)


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler = start_scheduler()
    yield
    scheduler.shutdown()


app = FastAPI(title=settings.APP_NAME, version="0.2.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.mount("/uploads", StaticFiles(directory="uploads"), name="uploads")

app.include_router(auth.router)
app.include_router(tenants.router)
app.include_router(plots.router)
app.include_router(enquiries.router)
app.include_router(bookings.router)
app.include_router(emi.router)
app.include_router(staff.router)
app.include_router(customer_auth.router)
app.include_router(uploads.router)
app.include_router(support_tickets.router)
app.include_router(payment_gateway.router)
app.include_router(geocode.router)
app.include_router(subscription_plans.router)


@app.get("/")
async def root():
    return {"app": settings.APP_NAME, "status": "running"}


@app.get("/health")
async def health():
    return {"status": "ok"}
