import uuid
from pydantic import BaseModel
from app.models.plot import PlotStatus


class ProjectCreate(BaseModel):
    name: str
    location: str | None = None
    survey_number: str | None = None
    dtcp_approval_no: str | None = None
    rera_reg_no: str | None = None
    description: str | None = None
    latitude: float | None = None
    longitude: float | None = None


class ProjectOut(ProjectCreate):
    id: uuid.UUID
    layout_image_url: str | None = None

    class Config:
        from_attributes = True


class PlotCreate(BaseModel):
    project_id: uuid.UUID
    block_id: uuid.UUID | None = None
    plot_number: str
    extent_sqft: float
    facing: str | None = None
    road_width_ft: float | None = None
    is_corner: bool = False
    price_per_sqft: float
    corner_premium: float = 0.0
    map_x_percent: float | None = None
    map_y_percent: float | None = None
    description: str | None = None
    amenities: str | None = None
    patta_number: str | None = None
    google_maps_link: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    dtcp_approved: bool | None = None
    dtcp_number: str | None = None
    rera_approved: bool | None = None
    rera_number: str | None = None


class PlotUpdate(BaseModel):
    price_per_sqft: float | None = None
    corner_premium: float | None = None
    status: PlotStatus | None = None
    description: str | None = None
    amenities: str | None = None
    patta_number: str | None = None
    google_maps_link: str | None = None
    image_url: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    dtcp_approved: bool | None = None
    dtcp_number: str | None = None
    rera_approved: bool | None = None
    rera_number: str | None = None


class PlotOut(BaseModel):
    id: uuid.UUID
    project_id: uuid.UUID
    plot_number: str
    extent_sqft: float
    facing: str | None
    road_width_ft: float | None
    is_corner: bool
    price_per_sqft: float
    corner_premium: float
    status: PlotStatus
    total_price: float
    image_url: str | None = None
    description: str | None = None
    amenities: str | None = None
    patta_number: str | None = None
    google_maps_link: str | None = None
    map_x_percent: float | None = None
    map_y_percent: float | None = None
    latitude: float | None = None
    longitude: float | None = None
    dtcp_approved: bool | None = None
    dtcp_number: str | None = None
    rera_approved: bool | None = None
    rera_number: str | None = None

    class Config:
        from_attributes = True
