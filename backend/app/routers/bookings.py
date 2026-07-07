import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id
from app.models.user import User
from app.models.plot import Plot, PlotStatus
from app.models.customer import Customer
from app.models.booking import Booking, BookingStatus
from app.schemas.booking import BookingCreate, BookingOut, BookingCancel

router = APIRouter(prefix="/api/bookings", tags=["bookings"])


async def _get_or_create_customer(db: AsyncSession, tenant_id: uuid.UUID, data) -> Customer:
    result = await db.execute(
        select(Customer).where(Customer.tenant_id == tenant_id, Customer.phone == data.phone)
    )
    customer = result.scalar_one_or_none()
    if customer:
        return customer
    customer = Customer(tenant_id=tenant_id, **data.model_dump())
    db.add(customer)
    await db.flush()
    return customer


@router.post("", response_model=BookingOut, status_code=status.HTTP_201_CREATED)
async def create_booking(
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(Plot).where(Plot.id == payload.plot_id, Plot.tenant_id == tenant_id))
    plot = result.scalar_one_or_none()
    if not plot:
        raise HTTPException(status_code=404, detail="Plot not found")
    if plot.status not in (PlotStatus.AVAILABLE, PlotStatus.HOLD):
        raise HTTPException(status_code=400, detail=f"Plot is currently {plot.status.value}, cannot book")

    customer = await _get_or_create_customer(db, tenant_id, payload.customer)
    co_owner = None
    if payload.co_owner:
        co_owner = await _get_or_create_customer(db, tenant_id, payload.co_owner)

    booking = Booking(
        tenant_id=tenant_id,
        plot_id=plot.id,
        customer_id=customer.id,
        co_owner_id=co_owner.id if co_owner else None,
        sold_by_id=user.id,
        total_price=plot.total_price,
        token_advance=payload.token_advance,
        status=BookingStatus.TOKEN_PAID,
    )
    db.add(booking)
    plot.status = PlotStatus.BOOKED

    await db.commit()
    await db.refresh(booking)
    return booking


@router.get("", response_model=list[BookingOut])
async def list_bookings(
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.tenant_id == tenant_id))
    return result.scalars().all()


@router.post("/{booking_id}/cancel", response_model=BookingOut)
async def cancel_booking(
    booking_id: uuid.UUID,
    payload: BookingCancel,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(select(Booking).where(Booking.id == booking_id, Booking.tenant_id == tenant_id))
    booking = result.scalar_one_or_none()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    booking.status = BookingStatus.CANCELLED
    booking.cancellation_reason = payload.reason
    booking.refund_amount = payload.refund_amount

    plot_result = await db.execute(select(Plot).where(Plot.id == booking.plot_id))
    plot = plot_result.scalar_one_or_none()
    if plot:
        plot.status = PlotStatus.AVAILABLE

    await db.commit()
    await db.refresh(booking)
    return booking
