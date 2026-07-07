import uuid
import enum
from sqlalchemy import Enum, ForeignKey, Float, String
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class BookingStatus(str, enum.Enum):
    TOKEN_PAID = "token_paid"
    CONFIRMED = "confirmed"
    CANCELLED = "cancelled"
    REGISTERED = "registered"


class Booking(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    __tablename__ = "bookings"

    plot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    co_owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    sold_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    token_advance: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.TOKEN_PAID)

    cancellation_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    refund_amount: Mapped[float] = mapped_column(Float, nullable=True)
