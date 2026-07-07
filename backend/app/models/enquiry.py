import uuid
import enum
from datetime import datetime
from sqlalchemy import String, Enum, ForeignKey, DateTime, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class EnquirySource(str, enum.Enum):
    WALK_IN = "walk_in"
    PHONE = "phone"
    WEBSITE = "website"
    REFERRAL = "referral"
    SOCIAL_MEDIA = "social_media"


class EnquiryStage(str, enum.Enum):
    NEW = "new"
    SITE_VISIT_SCHEDULED = "site_visit_scheduled"
    SITE_VISIT_DONE = "site_visit_done"
    NEGOTIATION = "negotiation"
    CONVERTED = "converted"
    LOST = "lost"


class Enquiry(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    __tablename__ = "enquiries"

    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    customer_name: Mapped[str] = mapped_column(String(150), nullable=False)
    customer_phone: Mapped[str] = mapped_column(String(20), nullable=False)
    customer_email: Mapped[str] = mapped_column(String(200), nullable=True)

    source: Mapped[EnquirySource] = mapped_column(Enum(EnquirySource), default=EnquirySource.PHONE)
    stage: Mapped[EnquiryStage] = mapped_column(Enum(EnquiryStage), default=EnquiryStage.NEW)

    assigned_to_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)
    next_followup_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    notes: Mapped[str] = mapped_column(Text, nullable=True)


class FollowUpLog(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Call/visit history against an enquiry - keeps the CRM trail auditable."""
    __tablename__ = "followup_logs"

    enquiry_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("enquiries.id", ondelete="CASCADE"))
    logged_by_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    interaction_type: Mapped[str] = mapped_column(String(30))  # call / visit / whatsapp / email
    remarks: Mapped[str] = mapped_column(Text, nullable=True)
