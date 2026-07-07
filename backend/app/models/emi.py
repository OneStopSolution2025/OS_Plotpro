import uuid
import enum
from datetime import date
from sqlalchemy import Enum, ForeignKey, Float, Date, Integer, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class InstallmentStatus(str, enum.Enum):
    PENDING = "pending"
    PAID = "paid"
    OVERDUE = "overdue"
    WAIVED = "waived"


class EMIInstallment(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """One row per installment in a booking's EMI schedule.
    Generated in bulk when a booking is confirmed (see routers/emi.py)."""
    __tablename__ = "emi_installments"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"))
    installment_number: Mapped[int] = mapped_column(Integer, nullable=False)
    due_date: Mapped[date] = mapped_column(Date, nullable=False)
    amount_due: Mapped[float] = mapped_column(Float, nullable=False)
    late_fee: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[InstallmentStatus] = mapped_column(Enum(InstallmentStatus), default=InstallmentStatus.PENDING)


class Payment(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Every actual money-received event — token advance, EMI payment, or
    ad-hoc payment — logs here. This is the source of truth for receipts/ledger."""
    __tablename__ = "payments"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"))
    installment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("emi_installments.id"), nullable=True)

    amount: Mapped[float] = mapped_column(Float, nullable=False)
    payment_mode: Mapped[str] = mapped_column(String(30))  # cash / cheque / upi / gateway
    reference_number: Mapped[str] = mapped_column(String(100), nullable=True)
    receipt_number: Mapped[str] = mapped_column(String(50), nullable=True, unique=True)
