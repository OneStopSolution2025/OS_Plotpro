from sqlalchemy import String
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class Customer(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Plot buyers. Login via phone + OTP for the self-service portal
    (OTP verification itself is handled in routers/auth.py via an SMS
    provider of your choice — Twilio Verify is already proven in WashPro)."""
    __tablename__ = "customers"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    phone: Mapped[str] = mapped_column(String(20), nullable=False, index=True)
    email: Mapped[str] = mapped_column(String(200), nullable=True)
    address: Mapped[str] = mapped_column(String(500), nullable=True)
    id_proof_type: Mapped[str] = mapped_column(String(50), nullable=True)   # Aadhaar / Passport etc.
    id_proof_number: Mapped[str] = mapped_column(String(50), nullable=True)

    # For co-owner/joint bookings, a second customer record can be linked
    # at the booking level (see booking.py: booking.co_owner_id)
