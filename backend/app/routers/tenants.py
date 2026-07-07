from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import hash_password
from app.core.deps import require_roles
from app.models.tenant import Tenant, SubscriptionPlan
from app.models.user import User, UserRole

router = APIRouter(prefix="/api/tenants", tags=["tenants (platform admin)"])


class TenantOnboard(BaseModel):
    company_name: str
    subdomain: str
    contact_email: EmailStr
    contact_phone: str | None = None
    country: str = "India"
    currency: str = "INR"
    admin_full_name: str
    admin_password: str


@router.post("/onboard", status_code=status.HTTP_201_CREATED)
async def onboard_tenant(
    payload: TenantOnboard,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Creates a new promoter (tenant) + their first ORG_ADMIN login in one go.
    This is how you (OS2) onboard a new client onto PlotPro."""
    existing = await db.execute(select(Tenant).where(Tenant.subdomain == payload.subdomain))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="Subdomain already taken")

    tenant = Tenant(
        company_name=payload.company_name,
        subdomain=payload.subdomain,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        country=payload.country,
        currency=payload.currency,
        subscription_plan=SubscriptionPlan.TRIAL,
    )
    db.add(tenant)
    await db.flush()  # get tenant.id before creating the admin user

    org_admin = User(
        tenant_id=tenant.id,
        full_name=payload.admin_full_name,
        email=payload.contact_email,
        hashed_password=hash_password(payload.admin_password),
        role=UserRole.ORG_ADMIN,
    )
    db.add(org_admin)
    await db.commit()

    return {"tenant_id": str(tenant.id), "subdomain": tenant.subdomain, "admin_email": org_admin.email}
