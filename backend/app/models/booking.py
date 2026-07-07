import uuid
import enum
from sqlalchemy import Enum, ForeignKey, Float, String, Index, text
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
    __table_args__ = (
        # Enforced at the database level, not just checked in application code —
        # this makes double-booking the same plot structurally impossible, even
        # under a race condition (e.g. a double-click firing two requests at once).
        Index(
            "uq_one_active_booking_per_plot",
            "plot_id",
            unique=True,
            postgresql_where=text("status != 'cancelled'"),
        ),
    )

    plot_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=False)
    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=False)
    co_owner_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id"), nullable=True)
    sold_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)

    total_price: Mapped[float] = mapped_column(Float, nullable=False)
    token_advance: Mapped[float] = mapped_column(Float, default=0.0)
    status: Mapped[BookingStatus] = mapped_column(Enum(BookingStatus), default=BookingStatus.TOKEN_PAID)

    cancellation_reason: Mapped[str] = mapped_column(String(500), nullable=True)
    refund_amount: Mapped[float] = mapped_column(Float, nullable=True)
