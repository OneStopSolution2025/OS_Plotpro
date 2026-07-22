import uuid
from pydantic import BaseModel


class OTPRequest(BaseModel):
    phone: str


class OTPVerify(BaseModel):
    phone: str
    otp_code: str


class CustomerToken(BaseModel):
    access_token: str
    token_type: str = "bearer"
    customer_id: uuid.UUID


class CustomerMeOut(BaseModel):
    id: uuid.UUID
    full_name: str
    phone: str
    email: str | None
    tenant_currency: str = "INR"

    class Config:
        from_attributes = True
