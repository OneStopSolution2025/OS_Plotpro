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
import logging

logger = logging.getLogger("plotpro.customer_auth")

router = APIRouter(prefix="/api/customer-auth", tags=["customer portal"])

OTP_VALID_MINUTES = 5


@router.post("/request-otp")
async def request_otp(payload: OTPRequest, db: AsyncSession = Depends(get_db)):
    """Phone-only login — no promoter code needed. Looks up which
    promoter(s) this phone belongs to directly, since customers shouldn't
    need to know or remember an internal subdomain value."""
    result = await db.execute(select(Customer).where(Customer.phone == payload.phone))
    matches = result.scalars().all()

    if not matches:
        raise HTTPException(status_code=404, detail="No account found for this phone number. Please contact your promoter.")
    if len(matches) > 1:
        # Same phone registered under more than one promoter — rare, but
        # handle it explicitly rather than guessing which one they mean.
        raise HTTPException(
            status_code=400,
            detail="This phone number is linked to more than one promoter account. Please contact support for help logging in.",
        )

    customer = matches[0]
    otp_code = f"{random.randint(100000, 999999)}"
    otp = CustomerOTP(
        tenant_id=customer.tenant_id,
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
    # .first() instead of .scalar_one_or_none() — the latter raises an
    # exception (not a clean "no match") if more than one row happens to
    # match, which .order_by() alone doesn't protect against.
    result = await db.execute(
        select(CustomerOTP)
        .where(
            CustomerOTP.phone == payload.phone,
            CustomerOTP.otp_code == payload.otp_code,
            CustomerOTP.is_used == False,  # noqa: E712
        )
        .order_by(CustomerOTP.created_at.desc())
    )
    otp = result.scalars().first()

    if not otp:
        # Diagnostic log: shows exactly why it didn't match (wrong code,
        # already used, or nothing sent at all) — check Railway Deploy
        # Logs for this line if "Invalid OTP" happens again.
        recent = await db.execute(
            select(CustomerOTP).where(CustomerOTP.phone == payload.phone).order_by(CustomerOTP.created_at.desc())
        )
        recent_rows = recent.scalars().all()[:3]
        logger.warning(
            f"OTP mismatch for phone {payload.phone}, entered code {payload.otp_code!r}. "
            f"Recent codes on file: {[(r.otp_code, 'used' if r.is_used else 'unused') for r in recent_rows]}"
        )
        raise HTTPException(status_code=400, detail="Invalid OTP")
    if otp.expires_at < datetime.now(timezone.utc):
        raise HTTPException(status_code=400, detail="OTP expired, please request a new one")

    otp.is_used = True
    await db.commit()

    token = create_access_token({"sub": str(otp.customer_id), "type": "customer", "tenant_id": str(otp.tenant_id)})
    return CustomerToken(access_token=token, customer_id=otp.customer_id)


@router.get("/me", response_model=CustomerMeOut)
async def customer_me(customer: Customer = Depends(get_current_customer), db: AsyncSession = Depends(get_db)):
    tenant_result = await db.execute(select(Tenant).where(Tenant.id == customer.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    out = CustomerMeOut.model_validate(customer)
    out.tenant_currency = tenant.currency if tenant else "INR"
    return out


@router.get("/my-bookings")
async def my_bookings(
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    from app.models.plot import Plot, Project

    result = await db.execute(select(Booking).where(Booking.customer_id == customer.id))
    bookings = result.scalars().all()

    out = []
    for b in bookings:
        plot_result = await db.execute(select(Plot).where(Plot.id == b.plot_id))
        plot = plot_result.scalar_one_or_none()
        project = None
        if plot:
            proj_result = await db.execute(select(Project).where(Project.id == plot.project_id))
            project = proj_result.scalar_one_or_none()
        out.append({
            "id": str(b.id),
            "plot_id": str(b.plot_id),
            "plot_number": plot.plot_number if plot else None,
            "project_name": project.name if project else None,
            "extent_sqft": plot.extent_sqft if plot else None,
            "image_url": plot.image_url if plot else None,
            "total_price": b.total_price,
            "status": b.status,
        })
    return out


@router.get("/booking-detail/{booking_id}")
async def booking_detail(
    booking_id: uuid.UUID,
    customer: Customer = Depends(get_current_customer),
    db: AsyncSession = Depends(get_db),
):
    """Full detail for the sale agreement view and the plot's live map —
    booking, plot (including GPS coordinates), project, and customer info."""
    from app.models.plot import Plot, Project

    booking_result = await db.execute(
        select(Booking).where(Booking.id == booking_id, Booking.customer_id == customer.id)
    )
    booking = booking_result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    plot_result = await db.execute(select(Plot).where(Plot.id == booking.plot_id))
    plot = plot_result.scalar_one_or_none()
    project = None
    if plot:
        proj_result = await db.execute(select(Project).where(Project.id == plot.project_id))
        project = proj_result.scalar_one_or_none()

    return {
        "booking": {
            "id": str(booking.id),
            "status": booking.status,
            "total_price": booking.total_price,
            "token_advance": booking.token_advance,
            "created_at": booking.created_at,
        },
        "plot": {
            "plot_number": plot.plot_number if plot else None,
            "extent_sqft": plot.extent_sqft if plot else None,
            "facing": plot.facing if plot else None,
            "patta_number": plot.patta_number if plot else None,
            # Needed so the customer portal can render the live map / street view
            "latitude": plot.latitude if plot else None,
            "longitude": plot.longitude if plot else None,
        } if plot else None,
        "project": {
            "name": project.name if project else None,
            "location": project.location if project else None,
            "survey_number": project.survey_number if project else None,
            "dtcp_approval_no": project.dtcp_approval_no if project else None,
            "rera_reg_no": project.rera_reg_no if project else None,
        } if project else None,
        "customer": {
            "full_name": customer.full_name,
            "phone": customer.phone,
            "address": customer.address,
        },
    }


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
