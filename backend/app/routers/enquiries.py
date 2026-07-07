import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id
from app.models.user import User
from app.models.enquiry import Enquiry, FollowUpLog
from app.schemas.enquiry import EnquiryCreate, EnquiryUpdate, EnquiryOut, FollowUpCreate

router = APIRouter(prefix="/api/enquiries", tags=["enquiries & CRM"])


@router.post("", response_model=EnquiryOut, status_code=status.HTTP_201_CREATED)
async def create_enquiry(
    payload: EnquiryCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    enquiry = Enquiry(tenant_id=tenant_id, **payload.model_dump())
    db.add(enquiry)
    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.get("", response_model=list[EnquiryOut])
async def list_enquiries(
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Enquiry).where(Enquiry.tenant_id == tenant_id))
    return result.scalars().all()


@router.patch("/{enquiry_id}", response_model=EnquiryOut)
async def update_enquiry(
    enquiry_id: uuid.UUID,
    payload: EnquiryUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Enquiry).where(Enquiry.id == enquiry_id, Enquiry.tenant_id == tenant_id))
    enquiry = result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(enquiry, field, value)

    await db.commit()
    await db.refresh(enquiry)
    return enquiry


@router.post("/{enquiry_id}/followups", status_code=status.HTTP_201_CREATED)
async def add_followup(
    enquiry_id: uuid.UUID,
    payload: FollowUpCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Enquiry).where(Enquiry.id == enquiry_id, Enquiry.tenant_id == tenant_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Enquiry not found")

    log = FollowUpLog(
        tenant_id=tenant_id,
        enquiry_id=enquiry_id,
        logged_by_id=user.id,
        interaction_type=payload.interaction_type,
        remarks=payload.remarks,
    )
    db.add(log)
    await db.commit()
    return {"status": "logged"}
