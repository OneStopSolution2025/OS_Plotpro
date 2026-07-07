import uuid
from datetime import datetime
from sqlalchemy import String, DateTime, Boolean, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class CustomerOTP(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Short-lived OTP for customer portal login. Swap send_otp() in
    services/notifications.py for Twilio Verify (already proven in WashPro)
    when you're ready to go live with real SMS."""
    __tablename__ = "customer_otps"

    customer_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("customers.id", ondelete="CASCADE"))
    phone: Mapped[str] = mapped_column(String(20), nullable=False)
    otp_code: Mapped[str] = mapped_column(String(6), nullable=False)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    is_used: Mapped[bool] = mapped_column(Boolean, default=False)
