import uuid
from datetime import date
from sqlalchemy import String, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TimestampMixin


class TenantPlanHistory(UUIDPKMixin, TimestampMixin, Base):
    """Auto-logged whenever a Supreme Admin changes a promoter's plan or
    expiry date — gives a clear record of what changed and when, without
    needing the admin to remember to note it anywhere themselves."""
    __tablename__ = "tenant_plan_history"

    tenant_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"))
    old_plan: Mapped[str] = mapped_column(String(20), nullable=True)
    new_plan: Mapped[str] = mapped_column(String(20), nullable=True)
    old_expires_at: Mapped[date] = mapped_column(Date, nullable=True)
    new_expires_at: Mapped[date] = mapped_column(Date, nullable=True)
    changed_by_email: Mapped[str] = mapped_column(String(200), nullable=True)
