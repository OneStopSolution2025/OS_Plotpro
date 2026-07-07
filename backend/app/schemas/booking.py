import uuid
from pydantic import BaseModel
from app.models.booking import BookingStatus


class CustomerCreate(BaseModel):
    full_name: str
    phone: str
    email: str | None = None
    address: str | None = None
    id_proof_type: str | None = None
    id_proof_number: str | None = None


class BookingCreate(BaseModel):
    plot_id: uuid.UUID
    customer: CustomerCreate
    co_owner: CustomerCreate | None = None
    token_advance: float = 0.0


class BookingOut(BaseModel):
    id: uuid.UUID
    plot_id: uuid.UUID
    customer_id: uuid.UUID
    total_price: float
    token_advance: float
    status: BookingStatus

    class Config:
        from_attributes = True


class BookingCancel(BaseModel):
    reason: str
    refund_amount: float | None = None
