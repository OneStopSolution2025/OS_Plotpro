import uuid
import enum
from sqlalchemy import String, Enum, ForeignKey, Float
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TimestampMixin


class PlatformOrderStatus(str, enum.Enum):
    CREATED = "created"
    PAID = "paid"
    FAILED = "failed"


class PlatformPaymentOrder(UUIDPKMixin, TimestampMixin, Base):
    """A Razorpay order for a PROMOTER paying OS2 Studio to upgrade their own
    subscription plan — distinct from PaymentOrder, which is a customer
    paying the promoter for EMI installments. Two entirely separate money
    flows that happen to use the same Razorpay account."""
    __tablename__ = "platform_payment_orders"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    plan_key: Mapped[str] = mapped_column(String(20), nullable=False)
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    razorpay_order_id: Mapped[str] = mapped_column(String(100), nullable=False, unique=True)
    status: Mapped[PlatformOrderStatus] = mapped_column(Enum(PlatformOrderStatus), default=PlatformOrderStatus.CREATED)
