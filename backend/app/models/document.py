import uuid
import enum
from datetime import date
from sqlalchemy import String, Enum, ForeignKey, Date
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class DocumentType(str, enum.Enum):
    EC = "encumbrance_certificate"
    PATTA = "patta"
    FMB_SKETCH = "fmb_sketch"
    DTCP_APPROVAL = "dtcp_approval"
    RERA_APPROVAL = "rera_approval"
    SALE_DEED = "sale_deed"
    OTHER = "other"


class LegalDocument(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """EC and other government docs are tracked here as a status/repository
    system — TN's tnreginet EC portal has no public API for automated pulls,
    so admin uploads the certificate copy and the app tracks validity/renewal."""
    __tablename__ = "legal_documents"

    project_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    plot_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("plots.id"), nullable=True)

    document_type: Mapped[DocumentType] = mapped_column(Enum(DocumentType), nullable=False)
    file_url: Mapped[str] = mapped_column(String(500), nullable=False)
    issued_date: Mapped[date] = mapped_column(Date, nullable=True)
    valid_until: Mapped[date] = mapped_column(Date, nullable=True)
    remarks: Mapped[str] = mapped_column(String(500), nullable=True)
