import uuid
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.config import settings
from app.core.customer_deps import get_current_customer
from app.models.customer import Customer
from app.models.booking import Booking
from app.models.emi import EMIInstallment, InstallmentStatus, Payment
from app.models.payment_order import PaymentOrder, PaymentOrderStatus

router = APIRouter(prefix="/api/payment-gateway", tags=["payment gateway"])


def _razorpay_client():
    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Online payment isn't configured yet. Contact your promoter to pay by cash/UPI, "
                   "or ask OS2 to set RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET.",
        )
    import razorpay
    return razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))


class CreateOrderRequest(BaseModel):
    booking_id: uuid.UUID
    installment_id: uuid.UUID | None = None
    amount: float


@router.post("/create-order")
async def create_order(
    payload: CreateOrderRequest,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """Customer-initiated: creates a Razorpay order for an EMI installment
    or ad-hoc amount. Frontend then opens Razorpay Checkout with this order_id."""
    booking_result = await db.execute(
        select(Booking).where(Booking.id == payload.booking_id, Booking.customer_id == customer.id)
    )
    booking = booking_result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    client = _razorpay_client()
    amount_paise = int(payload.amount * 100)
    rp_order = client.order.create({
        "amount": amount_paise,
        "currency": "INR",
        "notes": {"booking_id": str(booking.id), "customer_id": str(customer.id)},
    })

    order = PaymentOrder(
        tenant_id=booking.tenant_id,
        booking_id=booking.id,
        installment_id=payload.installment_id,
        amount=payload.amount,
        razorpay_order_id=rp_order["id"],
    )
    db.add(order)
    await db.commit()

    return {
        "razorpay_order_id": rp_order["id"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": amount_paise,
        "currency": "INR",
    }


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/verify-payment")
async def verify_payment(
    payload: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    """Called by the frontend after Razorpay Checkout succeeds. Verifies the
    HMAC signature server-side (never trust the client alone) before marking
    the installment paid and writing the ledger entry."""
    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(
        settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256
    ).hexdigest()

    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    order_result = await db.execute(
        select(PaymentOrder).where(PaymentOrder.razorpay_order_id == payload.razorpay_order_id)
    )
    order = order_result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == PaymentOrderStatus.PAID:
        return {"status": "already_processed"}

    order.status = PaymentOrderStatus.PAID

    receipt_number = f"RZP-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        tenant_id=order.tenant_id,
        booking_id=order.booking_id,
        installment_id=order.installment_id,
        amount=order.amount,
        payment_mode="gateway",
        reference_number=payload.razorpay_payment_id,
        receipt_number=receipt_number,
    )
    db.add(payment)

    if order.installment_id:
        inst_result = await db.execute(select(EMIInstallment).where(EMIInstallment.id == order.installment_id))
        installment = inst_result.scalar_one_or_none()
        if installment:
            installment.status = InstallmentStatus.PAID

    await db.commit()
    return {"status": "success", "receipt_number": receipt_number}
