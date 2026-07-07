import uuid
from datetime import date
from sqlalchemy import String, ForeignKey, Float, Date, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class CommissionPayout(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """A record of commission actually paid out to a staff member — separate
    from the live 'earned' calculation in the performance endpoint, which is
    just sales × %. This table is the source of truth for what's been settled,
    so accounts can track owed-vs-paid instead of re-paying the same amount."""
    __tablename__ = "commission_payouts"

    staff_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"))
    amount: Mapped[float] = mapped_column(Float, nullable=False)
    period_label: Mapped[str] = mapped_column(String(50), nullable=True)  # e.g. "July 2026"
    paid_date: Mapped[date] = mapped_column(Date, nullable=False)
    payment_mode: Mapped[str] = mapped_column(String(30), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)
    recorded_by_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
