import random
import uuid
from datetime import datetime, timedelta, timezone
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import create_access_token
from app.core.customer_deps import get_current_customer
from app.models.tenant import Tenant
from app.models.customer import Customer
from app.models.otp import CustomerOTP
from app.models.booking import Booking
from app.models.emi import EMIInstallment, Payment
from app.schemas.customer_auth import OTPRequest, OTPVerify, CustomerToken, CustomerMeOut
from app.services.notifications import send_sms

router = APIRouter(prefix="/api/customer-auth", tags=["customer portal"])

OTP_VALID_MINUTES = 5


async def _get_tenant_by_subdomain(db: AsyncSession, subdomain: str) -> Tenant:
    result = await db.execute(select(Tenant).where(Tenant.subdomain == subdomain))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Unknown promoter")
    return tenant


@router.post("/request-otp")
async def request_otp(payload: OTPRequest, db: AsyncSession = Depends(get_db)):
    tenant = await _get_tenant_by_subdomain(db, payload.tenant_subdomain)

    result = await db.execute(
        select(Customer).where(Customer.tenant_id == tenant.id, Customer.phone == payload.phone)
    )
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="No account found for this phone number with this promoter")

    otp_code = f"{random.randint(100000, 999999)}"
    otp = CustomerOTP(
        tenant_id=tenant.id,
        customer_id=customer.id,
        phone=payload.phone,
        otp_code=otp_code,
        expires_at=datetime.now(timezone.utc) + timedelta(minutes=OTP_VALID_MINUTES),
    )
    db.add(otp)
    await db.commit()

    await send_sms(payload.phone, f"Your OS2 PlotPro OTP is {otp_code}. Valid for {OTP_VALID_MINUTES} minutes.")
    return {"status": "otp_sent", "expires_in_minutes": OTP_VALID_MINUTES}


@router.post("/verify-otp", response_model=CustomerToken)
async def verify_otp(payload: OTPVerify, db: AsyncSession = Depends(get_db)):
    tenant = await _get_tenant_by_subdomain(db, payload.tenant_subdomain)

    result = await db.execute(
        select(CustomerOTP)
        .where(
            CustomerOTP.tenant_id == tenant.id,
            CustomerOTP.phone == payload.phone,
            CustomerOTP.otp_code == payload.otp_code,
            CustomerOTP.is_used == False,  # noqa: E712
        )
        .order_by(CustomerOTP.created_at.desc())
    )
    otp = result.scalar_one_or_none()
    if not otp:
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired, please request a new one")

    otp.is_used = True
    await db.commit()

    token = create_access_token({"sub": str(otp.customer_id), "type": "customer", "tenant_id": str(tenant.id)})
    return CustomerToken(access_token=token, customer_id=otp.customer_id)


@router.get("/me", response_model=CustomerMeOut)
async def customer_me(customer: Customer = Depends(get_current_customer)):
    return customer


@router.get("/my-bookings")
async def my_bookings(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Booking).where(Booking.customer_id == customer.id))
    bookings = result.scalars().all()
    return [
        {
            "id": str(b.id),
            "plot_id": str(b.plot_id),
            "total_price": b.total_price,
            "status": b.status,
        }
        for b in bookings
    ]


@router.get("/my-ledger/{booking_id}")
async def my_ledger(
    booking_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """Customer-facing EMI ledger — same shape as the admin ledger endpoint,
    but scoped to bookings owned by the logged-in customer only."""
    booking_result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.customer_id == customer.id)
    )
    if not booking_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Booking not found")

    installments = (await db.execute(
        select(EMIInstallment).where(EMIInstallment.booking_id == booking_id).order_by(EMIInstallment.installment_number)
    )).scalars().all()
    payments = (await db.execute(select(Payment).where(Payment.booking_id == booking_id))).scalars().all()

    return {
        "installments": [
            {"id": str(i.id), "number": i.installment_number, "due_date": i.due_date, "amount_due": i.amount_due, "status": i.status}
            for i in installments
        ],
        "payments": [
            {"amount": p.amount, "mode": p.payment_mode, "receipt_number": p.receipt_number}
            for p in payments
        ],
    }
