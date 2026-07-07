"""
Background reminder jobs. Started from main.py on app startup.

Two jobs:
1. EMI due reminders — runs daily, texts customers whose installment is due
   in the next 3 days, and flags anything past due as OVERDUE.
2. Legal document expiry alerts — runs daily, texts the org admin when an
   EC/RERA/DTCP doc is within 30 days of its valid_until date.
"""
import logging
from datetime import date, timedelta
from apscheduler.schedulers.asyncio import AsyncIOScheduler
from sqlalchemy import select

from app.core.database import AsyncSessionLocal
from app.models.emi import EMIInstallment, InstallmentStatus
from app.models.booking import Booking
from app.models.customer import Customer
from app.models.document import LegalDocument
from app.models.tenant import Tenant
from app.models.user import User, UserRole
from app.services.notifications import send_sms

logger = logging.getLogger("plotpro.reminders")


async def check_emi_due():
    async with AsyncSessionLocal() as db:
        today = date.today()
        upcoming_cutoff = today + timedelta(days=3)

        result = await db.execute(
            select(EMIInstallment).where(
                EMIInstallment.status == InstallmentStatus.PENDING,
                EMIInstallment.due_date <= upcoming_cutoff,
            )
        )
        installments = result.scalars().all()

        for inst in installments:
            if inst.due_date < today:
                inst.status = InstallmentStatus.OVERDUE

            booking_result = await db.execute(select(Booking).where(Booking.id == inst.booking_id))
            booking = booking_result.scalar_one_or_none()
            if not booking:
                continue
            customer_result = await db.execute(select(Customer).where(Customer.id == booking.customer_id))
            customer = customer_result.scalar_one_or_none()
            if not customer:
                continue

            status_word = "is OVERDUE" if inst.due_date < today else f"is due on {inst.due_date}"
            await send_sms(
                customer.phone,
                f"Dear {customer.full_name}, your EMI installment #{inst.installment_number} "
                f"of amount {inst.amount_due} {status_word}. Please pay at the earliest.",
            )

        await db.commit()
        logger.info(f"EMI reminder job: processed {len(installments)} installments")


async def check_document_expiry():
    async with AsyncSessionLocal() as db:
        cutoff = date.today() + timedelta(days=30)
        result = await db.execute(
            select(LegalDocument).where(
                LegalDocument.valid_until.is_not(None),
                LegalDocument.valid_until <= cutoff,
            )
        )
        docs = result.scalars().all()

        for doc in docs:
            admin_result = await db.execute(
                select(User).where(User.tenant_id == doc.tenant_id, User.role == UserRole.ORG_ADMIN)
            )
            admin = admin_result.scalars().first()
            if admin and admin.phone:
                await send_sms(
                    admin.phone,
                    f"Alert: {doc.document_type.value} is expiring on {doc.valid_until}. Please renew.",
                )
        logger.info(f"Document expiry job: checked {len(docs)} documents nearing expiry")


def start_scheduler() -> AsyncIOScheduler:
    scheduler = AsyncIOScheduler()
    scheduler.add_job(check_emi_due, "cron", hour=9, minute=0, id="emi_due_check")
    scheduler.add_job(check_document_expiry, "cron", hour=9, minute=15, id="doc_expiry_check")
    scheduler.start()
    logger.info("PlotPro reminder scheduler started")
    return scheduler
