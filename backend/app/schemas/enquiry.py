import uuid
from datetime import datetime
from pydantic import BaseModel
from app.models.enquiry import EnquirySource, EnquiryStage


class EnquiryCreate(BaseModel):
    project_id: uuid.UUID | None = None
    customer_name: str
    customer_phone: str
    customer_email: str | None = None
    source: EnquirySource = EnquirySource.PHONE
    notes: str | None = None


class EnquiryUpdate(BaseModel):
    stage: EnquiryStage | None = None
    assigned_to_id: uuid.UUID | None = None
    next_followup_at: datetime | None = None
    notes: str | None = None


class EnquiryOut(BaseModel):
    id: uuid.UUID
    customer_name: str
    customer_phone: str
    source: EnquirySource
    stage: EnquiryStage
    assigned_to_id: uuid.UUID | None
    next_followup_at: datetime | None

    class Config:
        from_attributes = True


class FollowUpCreate(BaseModel):
    interaction_type: str
    remarks: str | None = None
