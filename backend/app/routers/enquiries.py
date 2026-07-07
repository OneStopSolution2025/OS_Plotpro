import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id
from app.models.user import User
from app.models.enquiry import Enquiry, EnquiryStage, FollowUpLog
from app.models.customer import Customer
from app.models.plot import Plot, PlotStatus
from app.models.booking import Booking, BookingStatus
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
    search: str | None = None,
    stage: str | None = None,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    query = select(Enquiry).where(Enquiry.tenant_id == tenant_id)
    if search:
        like = f"%{search}%"
        query = query.where(
            (Enquiry.customer_name.ilike(like)) | (Enquiry.customer_phone.ilike(like))
        )
    if stage:
        query = query.where(Enquiry.stage == stage)
    result = await db.execute(query.order_by(Enquiry.created_at.desc()))
    return result.scalars().all()


class BulkStageUpdate(BaseModel):
    enquiry_ids: list[uuid.UUID]
    stage: str


@router.post("/bulk-update-stage")
async def bulk_update_stage(
    payload: BulkStageUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Enquiry).where(Enquiry.id.in_(payload.enquiry_ids), Enquiry.tenant_id == tenant_id)
    )
    enquiries = result.scalars().all()
    for e in enquiries:
        e.stage = payload.stage
    await db.commit()
    return {"updated": len(enquiries)}


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


class ConvertToBooking(BaseModel):
    plot_id: uuid.UUID
    token_advance: float = 0.0


@router.post("/{enquiry_id}/convert-to-booking")
async def convert_to_booking(
    enquiry_id: uuid.UUID,
    payload: ConvertToBooking,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    user: User = Depends(get_current_user),
):
    """Turns an enquiry directly into a booking — reuses the enquiry's
    name/phone instead of making staff retype it in the Bookings form."""
    enq_result = await db.execute(select(Enquiry).where(Enquiry.id == enquiry_id, Enquiry.tenant_id == tenant_id))
    enquiry = enq_result.scalar_one_or_none()
    if not enquiry:
        raise HTTPException(status_code=404, detail="Enquiry not found")

    plot_result = await db.execute(select(Plot).where(Plot.id == payload.plot_id, Plot.tenant_id == tenant_id))
    plot = plot_result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    if plot.status not in (PlotStatus.AVAILABLE, PlotStatus.HOLD):
        raise HTTPException(status_code=400, detail=f"Plot is currently {plot.status.value}, cannot book")

    # Reuse an existing customer record by phone, or create one from the enquiry
    cust_result = await db.execute(
        select(Customer).where(Customer.tenant_id == tenant_id, Customer.phone == enquiry.customer_phone)
    )
    customer = cust_result.scalar_one_or_none()
    if not customer:
        customer = Customer(
            tenant_id=tenant_id,
            full_name=enquiry.customer_name,
            phone=enquiry.customer_phone,
            email=enquiry.customer_email,
        )
        db.add(customer)
        await db.flush()

    booking = Booking(
        tenant_id=tenant_id,
        plot_id=plot.id,
        customer_id=customer.id,
        sold_by_id=user.id,
        total_price=plot.total_price,
        token_advance=payload.token_advance,
        status=BookingStatus.TOKEN_PAID,
    )
    db.add(booking)
    plot.status = PlotStatus.BOOKED
    enquiry.stage = EnquiryStage.CONVERTED

    await db.commit()
    await db.refresh(booking)
    return {"booking_id": str(booking.id), "status": "converted"}
