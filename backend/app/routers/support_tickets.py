import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id, require_roles
from app.core.customer_deps import get_current_customer
from app.models.user import User, UserRole
from app.models.customer import Customer
from app.models.tenant import Tenant
from app.models.support_ticket import SupportTicket, TicketStatus

router = APIRouter(tags=["support tickets"])


class TicketCreate(BaseModel):
    subject: str
    message: str
    booking_id: uuid.UUID | None = None


class TicketReply(BaseModel):
    staff_reply: str
    status: TicketStatus = TicketStatus.RESOLVED


# ---------- Customer-facing ----------

@router.post("/api/customer-auth/support-tickets", status_code=status.HTTP_201_CREATED)
async def create_ticket(
    payload: TicketCreate,
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    ticket = SupportTicket(
        tenant_id=customer.tenant_id,
        customer_id=customer.id,
        booking_id=payload.booking_id,
        subject=payload.subject,
        message=payload.message,
    )
    db.add(ticket)
    await db.commit()
    await db.refresh(ticket)
    return {"id": str(ticket.id), "status": ticket.status}


@router.get("/api/customer-auth/support-tickets")
async def my_tickets(
    db: AsyncSession = Depends(get_db),
    customer: Customer = Depends(get_current_customer),
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.customer_id == customer.id).order_by(SupportTicket.created_at.desc())
    )
    tickets = result.scalars().all()
    return [
        {
            "id": str(t.id), "subject": t.subject, "message": t.message,
            "status": t.status, "staff_reply": t.staff_reply, "created_at": t.created_at,
        }
        for t in tickets
    ]


# ---------- Staff-facing ----------

@router.get("/api/support-tickets")
async def list_tickets(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    """Org admins/staff see only their own tenant's tickets. Platform admin
    (OS2 Studio) sees every promoter's tickets, since it's the one place
    OS2 can offer support across all its customers."""
    query = select(SupportTicket)
    if user.role != UserRole.PLATFORM_ADMIN:
        query = query.where(SupportTicket.tenant_id == user.tenant_id)
    result = await db.execute(query.order_by(SupportTicket.created_at.desc()))
    tickets = result.scalars().all()

    out = []
    for t in tickets:
        tenant_name = None
        if user.role == UserRole.PLATFORM_ADMIN:
            tenant_result = await db.execute(select(Tenant).where(Tenant.id == t.tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            tenant_name = tenant.company_name if tenant else None
        out.append({
            "id": str(t.id), "subject": t.subject, "message": t.message,
            "status": t.status, "staff_reply": t.staff_reply, "created_at": t.created_at,
            "promoter_name": tenant_name,
        })
    return out


@router.patch("/api/support-tickets/{ticket_id}")
async def reply_ticket(
    ticket_id: uuid.UUID,
    payload: TicketReply,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    query = select(SupportTicket).where(SupportTicket.id == ticket_id)
    if user.role != UserRole.PLATFORM_ADMIN:
        query = query.where(SupportTicket.tenant_id == user.tenant_id)
    result = await db.execute(query)
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.staff_reply = payload.staff_reply
    ticket.status = payload.status
    ticket.resolved_by_id = user.id
    await db.commit()
    return {"status": "updated"}
