import uuid
import enum
from sqlalchemy import String, Float, ForeignKey, Enum, Text
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class PlotStatus(str, enum.Enum):
    AVAILABLE = "available"
    HOLD = "hold"
    BOOKED = "booked"
    SOLD = "sold"
    REGISTERED = "registered"


class Project(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """A layout/venture, e.g. 'Dream City Phase 2, Dindigul'."""
    __tablename__ = "projects"

    name: Mapped[str] = mapped_column(String(200), nullable=False)
    location: Mapped[str] = mapped_column(String(300), nullable=True)
    survey_number: Mapped[str] = mapped_column(String(100), nullable=True)
    dtcp_approval_no: Mapped[str] = mapped_column(String(100), nullable=True)
    rera_reg_no: Mapped[str] = mapped_column(String(100), nullable=True)
    layout_image_url: Mapped[str] = mapped_column(String(500), nullable=True)  # for the clickable plot map
    description: Mapped[str] = mapped_column(Text, nullable=True)


class Block(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Optional grouping within a project, e.g. 'Block A'. Small projects can skip this."""
    __tablename__ = "blocks"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    name: Mapped[str] = mapped_column(String(100), nullable=False)


class Plot(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    __tablename__ = "plots"

    project_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("projects.id", ondelete="CASCADE"))
    block_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("blocks.id", ondelete="SET NULL"), nullable=True)

    plot_number: Mapped[str] = mapped_column(String(20), nullable=False)
    extent_sqft: Mapped[float] = mapped_column(Float, nullable=False)
    facing: Mapped[str] = mapped_column(String(20), nullable=True)   # East/West/North/South
    road_width_ft: Mapped[float] = mapped_column(Float, nullable=True)
    is_corner: Mapped[bool] = mapped_column(default=False)

    price_per_sqft: Mapped[float] = mapped_column(Float, nullable=False)
    corner_premium: Mapped[float] = mapped_column(Float, default=0.0)

    status: Mapped[PlotStatus] = mapped_column(Enum(PlotStatus), default=PlotStatus.AVAILABLE)

    # Coordinates for the clickable layout map overlay (percentage-based x/y
    # on top of layout_image_url, so it works regardless of image resolution)
    map_x_percent: Mapped[float] = mapped_column(Float, nullable=True)
    map_y_percent: Mapped[float] = mapped_column(Float, nullable=True)

    @property
    def total_price(self) -> float:
        return (self.extent_sqft * self.price_per_sqft) + self.corner_premium
