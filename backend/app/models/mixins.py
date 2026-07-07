import uuid
from datetime import datetime
from sqlalchemy import ForeignKey, DateTime, func
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID


class UUIDPKMixin:
    """Every table uses a UUID primary key instead of auto-increment int.
    Safer for a multi-tenant SaaS (no guessable sequential IDs across tenants)."""
    id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
    )


class TenantScopedMixin:
    """Every business table (plots, bookings, staff, etc.) carries a tenant_id.
    ALWAYS filter queries by tenant_id in the service layer — this column alone
    does not enforce isolation, the query code must."""
    tenant_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("tenants.id", ondelete="CASCADE"), index=True, nullable=False
    )


class TimestampMixin:
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
