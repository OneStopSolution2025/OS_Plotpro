from datetime import date
from sqlalchemy import String, Boolean, Enum, Date
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TimestampMixin


class SubscriptionPlan(str, enum.Enum):
    TRIAL = "trial"
    BASIC = "basic"
    PRO = "pro"
    ENTERPRISE = "enterprise"


class Tenant(UUIDPKMixin, TimestampMixin, Base):
    """A tenant = one real estate promoter/agency using OS2 PlotPro.
    This table itself is NOT tenant-scoped (it IS the tenant)."""
    __tablename__ = "tenants"

    company_name: Mapped[str] = mapped_column(String(200), nullable=False)
    subdomain: Mapped[str] = mapped_column(String(100), unique=True, nullable=False)  # internal identifier only
    contact_email: Mapped[str] = mapped_column(String(200), nullable=False)
    contact_phone: Mapped[str] = mapped_column(String(20), nullable=True)
    country: Mapped[str] = mapped_column(String(50), default="India")
    currency: Mapped[str] = mapped_column(String(5), default="INR")  # INR / MYR etc.

    # Platform billing (what OS2 charges THIS promoter — separate from the
    # promoter's own customer billing which lives in billing.py)
    subscription_plan: Mapped[SubscriptionPlan] = mapped_column(
        Enum(SubscriptionPlan), default=SubscriptionPlan.TRIAL
    )
    subscription_started_at: Mapped[date] = mapped_column(Date, nullable=True)
    subscription_expires_at: Mapped[date] = mapped_column(Date, nullable=True)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
