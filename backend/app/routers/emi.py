import uuid
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id
from app.models.user import User
from app.models.booking import Booking
from app.models.emi import EMIInstallment, InstallmentStatus, Payment
from app.schemas.emi import EMIScheduleGenerate, EMIInstallmentOut, PaymentCreate, PaymentOut

router = APIRouter(prefix="/api/emi", tags=["emi & billing"])


@router.post("/generate-schedule", response_model=list[EMIInstallmentOut], status_code=status.HTTP_201_CREATED)
async def generate_schedule(
    payload: EMIScheduleGenerate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.id == payload.booking_id, Booking.tenant_id == tenant_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    existing = await db.execute(select(EMIInstallment).where(EMIInstallment.booking_id == booking.id))
    if existing.scalars().first():
        raise HTTPException(status_code=400, detail="EMI schedule already generated for this booking")

    remaining = booking.total_price - booking.token_advance - payload.down_payment
    if remaining <= 0 or payload.number_of_installments <= 0:
        raise HTTPException(status_code=400, detail="Nothing left to schedule, check down payment vs total price")

    per_installment = round(remaining / payload.number_of_installments, 2)
    installments = []
    for i in range(payload.number_of_installments):
        due = payload.first_due_date + timedelta(days=payload.frequency_days * i)
        installments.append(
            EMIInstallment(
                tenant_id=tenant_id,
                booking_id=booking.id,
                installment_number=i + 1,
                due_date=due,
                amount_due=per_installment,
                status=InstallmentStatus.PENDING,
            )
        )
    db.add_all(installments)
    await db.commit()
    for inst in installments:
        await db.refresh(inst)
    return installments


@router.get("/schedule/{booking_id}", response_model=list[EMIInstallmentOut])
async def get_schedule(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(EMIInstallment)
        .where(EMIInstallment.booking_id == booking_id, EMIInstallment.tenant_id == tenant_id)
        .order_by(EMIInstallment.installment_number)
    )
    return result.scalars().all()


@router.post("/payments", response_model=PaymentOut, status_code=status.HTTP_201_CREATED)
async def record_payment(
    payload: PaymentCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    booking_result = await db.execute(select(Booking).where(Booking.id == payload.booking_id, Booking.tenant_id == tenant_id))
    if not booking_result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Booking not found")

    receipt_number = f"RCPT-{uuid.uuid4().hex[:8].upper()}"
    payment = Payment(
        tenant_id=tenant_id,
        booking_id=payload.booking_id,
        installment_id=payload.installment_id,
        amount=payload.amount,
        payment_mode=payload.payment_mode,
        reference_number=payload.reference_number,
        receipt_number=receipt_number,
    )
    db.add(payment)

    if payload.installment_id:
        inst_result = await db.execute(
            select(EMIInstallment).where(EMIInstallment.id == payload.installment_id, EMIInstallment.tenant_id == tenant_id)
        )
        installment = inst_result.scalar_one_or_none()
        if installment:
            installment.status = InstallmentStatus.PAID

    await db.commit()
    await db.refresh(payment)
    return payment


@router.get("/ledger/{booking_id}")
async def get_ledger(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    """Quick paid-vs-due snapshot for a booking — powers the customer portal ledger view."""
    installments = (await db.execute(
        select(EMIInstallment).where(EMIInstallment.booking_id == booking_id, EMIInstallment.tenant_id == tenant_id)
    )).scalars().all()
    payments = (await db.execute(
        select(Payment).where(Payment.booking_id == booking_id, Payment.tenant_id == tenant_id)
    )).scalars().all()

    total_due = sum(i.amount_due + i.late_fee for i in installments)
    total_paid = sum(p.amount for p in payments)
    overdue_count = sum(1 for i in installments if i.status == InstallmentStatus.OVERDUE)

    return {
        "booking_id": str(booking_id),
        "total_scheduled": total_due,
        "total_paid": total_paid,
        "balance": total_due - total_paid,
        "overdue_installments": overdue_count,
    }
