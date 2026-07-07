import uuid
from datetime import date
from pydantic import BaseModel
from app.models.emi import InstallmentStatus


class EMIScheduleGenerate(BaseModel):
    booking_id: uuid.UUID
    down_payment: float
    number_of_installments: int
    first_due_date: date
    frequency_days: int = 30  # 30 = monthly, 90 = quarterly, etc.


class EMIInstallmentOut(BaseModel):
    id: uuid.UUID
    installment_number: int
    due_date: date
    amount_due: float
    late_fee: float
    status: InstallmentStatus

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    booking_id: uuid.UUID
    installment_id: uuid.UUID | None = None
    amount: float
    payment_mode: str
    reference_number: str | None = None


class PaymentOut(BaseModel):
    id: uuid.UUID
    booking_id: uuid.UUID
    amount: float
    payment_mode: str
    receipt_number: str | None

    class Config:
        from_attributes = True
