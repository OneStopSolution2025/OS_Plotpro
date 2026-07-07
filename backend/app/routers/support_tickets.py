import uuid
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, get_tenant_id
from app.core.customer_deps import get_current_customer
from app.models.user import User
from app.models.customer import Customer
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
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    _user: User = Depends(get_current_user),
):
    result = await db.execute(
        select(SupportTicket).where(SupportTicket.tenant_id == tenant_id).order_by(SupportTicket.created_at.desc())
    )
    tickets = result.scalars().all()
    return [
        {
            "id": str(t.id), "subject": t.subject, "message": t.message,
            "status": t.status, "staff_reply": t.staff_reply, "created_at": t.created_at,
        }
        for t in tickets
    ]


@router.patch("/api/support-tickets/{ticket_id}")
async def reply_ticket(
    ticket_id: uuid.UUID,
    payload: TicketReply,
    db: AsyncSession = Depends(get_db),
    tenant_id: uuid.UUID = Depends(get_tenant_id),
    user: User = Depends(get_current_user),
):
    result = await db.execute(select(SupportTicket).where(SupportTicket.id == ticket_id, SupportTicket.tenant_id == tenant_id))
    ticket = result.scalar_one_or_none()
    if not ticket:
        raise HTTPException(status_code=404, detail="Ticket not found")
    ticket.staff_reply = payload.staff_reply
    ticket.status = payload.status
    ticket.resolved_by_id = user.id
    await db.commit()
    return {"status": "updated"}
