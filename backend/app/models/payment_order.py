import uuid
import enum
from sqlalchemy import String, Enum, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class PaymentOrderStatus(str, enum.Enum):
    CREATED = "created"
    PAID = "paid"
    FAILED = "failed"


class PaymentOrder(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Tracks a Razorpay order created for online EMI payment. Kept
    separate from the `Payment` ledger table — a PaymentOrder becomes a
    Payment row only once Razorpay confirms success via signature
    verification (see routers/payment_gateway.py)."""
    __tablename__ = "payment_orders"

    booking_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("bookings.id", ondelete="CASCADE"))
    installment_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("emi_installments.id"), nullable=True)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    razorpay_order_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[PaymentOrderStatus] = mapped_column(Enum(PaymentOrderStatus), default=PaymentOrderStatus.CREATED)
