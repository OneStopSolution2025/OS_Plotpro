from sqlalchemy import String, Float, Text
from sqlalchemy.orm import Mapped, mapped_column
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TimestampMixin


class SubscriptionPlanConfig(UUIDPKMixin, TimestampMixin, Base):
    """Defines what each plan tier (trial/basic/pro/enterprise) actually
    means — price, limits, features. Editable only by the Supreme Admin.
    Tenant.subscription_plan just stores which of these keys a promoter
    is on; this table is the source of truth for what that key includes."""
    __tablename__ = "subscription_plan_configs"

    plan_key: Mapped[str] = mapped_column(String(20), unique=True, nullable=False)  # trial/basic/pro/enterprise
    display_name: Mapped[str] = mapped_column(String(100), nullable=False)
    price: Mapped[float] = mapped_column(Float, default=0.0)
    currency: Mapped[str] = mapped_column(String(5), default="INR")
    billing_cycle: Mapped[str] = mapped_column(String(20), default="monthly")  # monthly/yearly
    max_projects: Mapped[int] = mapped_column(nullable=True)  # None = unlimited
    max_staff: Mapped[int] = mapped_column(nullable=True)
    max_plots: Mapped[int] = mapped_column(nullable=True)
    description: Mapped[str] = mapped_column(Text, nullable=True)
    features: Mapped[str] = mapped_column(Text, nullable=True)  # comma-separated bullets
