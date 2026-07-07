import uuid
import csv
import io
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id, require_roles
from app.models.user import User, UserRole
from app.models.attendance import Attendance, AttendanceStatus
from app.models.booking import Booking, BookingStatus
from app.schemas.auth import UserOut

router = APIRouter(prefix="/api/staff", tags=["staff management"])


@router.get("", response_model=list[UserOut])
async def list_staff(
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    result = await db.execute(select(User).where(User.tenant_id == tenant_id))
    return result.scalars().all()


@router.patch("/{staff_id}/deactivate")
async def deactivate_staff(
    staff_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    result = await db.execute(select(User).where(User.id == staff_id, User.tenant_id == tenant_id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    staff.is_active = False
    await db.commit()
    return {"status": "deactivated"}


class TargetUpdate(BaseModel):
    monthly_target: int | None = None
    commission_percent: float | None = None


@router.patch("/{staff_id}/target")
async def set_target(
    staff_id: uuid.UUID,
    payload: TargetUpdate,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    result = await db.execute(select(User).where(User.id == staff_id, User.tenant_id == tenant_id))
    staff = result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(staff, field, value)
    await db.commit()
    return {"status": "updated"}


# ---------- Attendance ----------

class AttendanceMark(BaseModel):
    user_id: uuid.UUID
    attendance_date: date
    status: AttendanceStatus = AttendanceStatus.PRESENT


@router.post("/attendance")
async def mark_attendance(
    payload: AttendanceMark,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER)),
):
    existing = await db.execute(
        select(Attendance).where(
            Attendance.user_id == payload.user_id,
            Attendance.attendance_date == payload.attendance_date,
            Attendance.tenant_id == tenant_id,
        )
    )
    record = existing.scalar_one_or_none()
    if record:
        record.status = payload.status
    else:
        record = Attendance(tenant_id=tenant_id, **payload.model_dump())
        db.add(record)
    await db.commit()
    return {"status": "marked"}


@router.get("/attendance/{user_id}")
async def get_attendance(
    user_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(Attendance)
        .where(Attendance.user_id == user_id, Attendance.tenant_id == tenant_id)
        .order_by(Attendance.attendance_date.desc())
    )
    rows = result.scalars().all()
    return [
        {"date": r.attendance_date, "status": r.status}
        for r in rows
    ]


# ---------- Commission / performance ----------

@router.get("/{staff_id}/performance")
async def staff_performance(
    staff_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.ACCOUNTANT)),
):
    staff_result = await db.execute(select(User).where(User.id == staff_id, User.tenant_id == tenant_id))
    staff = staff_result.scalar_one_or_none()
    if not staff:
        raise HTTPException(status_code=404, detail="Staff not found")

    bookings_result = await db.execute(
        select(Booking).where(
            Booking.sold_by_id == staff_id,
            Booking.tenant_id == tenant_id,
            Booking.status != BookingStatus.CANCELLED,
        )
    )
    bookings = bookings_result.scalars().all()
    total_sales_value = sum(b.total_price for b in bookings)
    commission_earned = round(total_sales_value * (staff.commission_percent / 100), 2)

    return {
        "staff_id": str(staff_id),
        "full_name": staff.full_name,
        "monthly_target": staff.monthly_target,
        "total_bookings": len(bookings),
        "total_sales_value": total_sales_value,
        "commission_percent": staff.commission_percent,
        "commission_earned": commission_earned,
    }


@router.get("/export/commissions.csv")
async def export_commissions_csv(
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.ACCOUNTANT)),
):
    """Downloadable CSV of every staff member's sales and commission —
    opens directly in Excel for payroll/payout processing."""
    staff_result = await db.execute(select(User).where(User.tenant_id == tenant_id))
    all_staff = staff_result.scalars().all()

    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["Name", "Role", "Monthly Target", "Bookings", "Sales Value", "Commission %", "Commission Earned"])

    for staff in all_staff:
        bookings_result = await db.execute(
            select(Booking).where(
                Booking.sold_by_id == staff.id,
                Booking.tenant_id == tenant_id,
                Booking.status != BookingStatus.CANCELLED,
            )
        )
        bookings = bookings_result.scalars().all()
        total_sales_value = sum(b.total_price for b in bookings)
        commission_earned = round(total_sales_value * (staff.commission_percent / 100), 2)
        writer.writerow([
            staff.full_name, staff.role.value, staff.monthly_target,
            len(bookings), total_sales_value, staff.commission_percent, commission_earned,
        ])

    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=commissions.csv"},
    )
