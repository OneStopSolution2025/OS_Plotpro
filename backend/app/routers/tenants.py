import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel, EmailStr

from app.core.database import get_db
from app.core.security import hash_password
from app.core.deps import require_roles
from app.models.tenant import Tenant, SubscriptionPlan
from app.models.tenant_plan_history import TenantPlanHistory
from app.models.user import User, UserRole
from app.models.plot import Plot
from app.models.booking import Booking

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
    subscription_plan: SubscriptionPlan = SubscriptionPlan.TRIAL


@router.post("/onboard", status_code=status.HTTP_201_CREATED)
async def onboard_tenant(
    payload: TenantOnboard,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Platform-admin-initiated onboarding — used when OS2 sets up a
    promoter directly rather than the promoter signing themselves up."""
    return await _create_tenant_and_admin(payload, db)


@router.post("/signup", status_code=status.HTTP_201_CREATED)
async def signup_tenant(
    payload: TenantOnboard,
    db: AsyncSession = Depends(get_db),
):
    """Public self-registration — no login required. A prospective promoter
    fills this in themselves (company details + their own admin credentials),
    lands in 'pending' status, and can't log in until OS2's Supreme Admin
    reviews and approves them from All Promoters."""
    return await _create_tenant_and_admin(payload, db)


async def _create_tenant_and_admin(payload: "TenantOnboard", db: AsyncSession):
    existing = await db.execute(select(Tenant).where(Tenant.subdomain == payload.subdomain))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="This account code is already taken — try a different company name or customize it.")

    existing_email = await db.execute(select(User).where(User.email == payload.contact_email))
    if existing_email.scalar_one_or_none():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    tenant = Tenant(
        company_name=payload.company_name,
        subdomain=payload.subdomain,
        contact_email=payload.contact_email,
        contact_phone=payload.contact_phone,
        country=payload.country,
        currency=payload.currency,
        subscription_plan=payload.subscription_plan,
        is_active=False,  # pending approval — Supreme Admin activates from All Promoters
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


@router.get("/overview")
async def platform_overview(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Cross-tenant snapshot for OS2's own team — usage per promoter,
    at a glance, without needing to log into each tenant separately."""
    tenants = (await db.execute(select(Tenant))).scalars().all()
    overview = []
    for t in tenants:
        plot_count = len((await db.execute(select(Plot).where(Plot.tenant_id == t.id))).scalars().all())
        booking_count = len((await db.execute(select(Booking).where(Booking.tenant_id == t.id))).scalars().all())
        staff_count = len((await db.execute(select(User).where(User.tenant_id == t.id))).scalars().all())

        days_to_expiry = None
        if t.subscription_expires_at:
            days_to_expiry = (t.subscription_expires_at - date.today()).days

        overview.append({
            "id": str(t.id),
            "company_name": t.company_name,
            "subdomain": t.subdomain,
            "subscription_plan": t.subscription_plan,
            "subscription_expires_at": t.subscription_expires_at,
            "days_to_expiry": days_to_expiry,
            "is_active": t.is_active,
            "plot_count": plot_count,
            "booking_count": booking_count,
            "staff_count": staff_count,
            "created_at": t.created_at,
        })
    return overview


@router.patch("/{tenant_id}/status")
async def set_tenant_status(
    tenant_id: uuid.UUID,
    is_active: bool,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Suspend or reactivate a promoter's access — e.g. for non-payment."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")
    tenant.is_active = is_active
    await db.commit()
    return {"status": "updated", "is_active": tenant.is_active}


class TenantUpdate(BaseModel):
    company_name: str | None = None
    contact_email: EmailStr | None = None
    contact_phone: str | None = None
    country: str | None = None
    currency: str | None = None
    subscription_plan: SubscriptionPlan | None = None
    subscription_started_at: date | None = None
    subscription_expires_at: date | None = None


@router.patch("/{tenant_id}")
async def update_tenant(
    tenant_id: uuid.UUID,
    payload: TenantUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    updates = payload.model_dump(exclude_unset=True)

    # Auto-log any plan or expiry change so there's always a clear history
    # of what was changed and by whom, without the admin having to
    # remember to note it anywhere separately.
    plan_changed = "subscription_plan" in updates and updates["subscription_plan"] != tenant.subscription_plan
    expiry_changed = "subscription_expires_at" in updates and updates["subscription_expires_at"] != tenant.subscription_expires_at

    if plan_changed and "subscription_started_at" not in updates:
        updates["subscription_started_at"] = date.today()

    if plan_changed or expiry_changed:
        history = TenantPlanHistory(
            tenant_id=tenant.id,
            old_plan=tenant.subscription_plan.value if tenant.subscription_plan else None,
            new_plan=updates.get("subscription_plan", tenant.subscription_plan).value if updates.get("subscription_plan", tenant.subscription_plan) else None,
            old_expires_at=tenant.subscription_expires_at,
            new_expires_at=updates.get("subscription_expires_at", tenant.subscription_expires_at),
            changed_by_email=admin.email,
        )
        db.add(history)

    for field, value in updates.items():
        setattr(tenant, field, value)

    await db.commit()
    return {"status": "updated"}


@router.get("/{tenant_id}/plan-history")
async def get_plan_history(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    result = await db.execute(
        select(TenantPlanHistory)
        .where(TenantPlanHistory.tenant_id == tenant_id)
        .order_by(TenantPlanHistory.created_at.desc())
    )
    history = result.scalars().all()
    return [
        {
            "id": str(h.id),
            "old_plan": h.old_plan,
            "new_plan": h.new_plan,
            "old_expires_at": h.old_expires_at,
            "new_expires_at": h.new_expires_at,
            "changed_by_email": h.changed_by_email,
            "changed_at": h.created_at,
        }
        for h in history
    ]


@router.delete("/{tenant_id}")
async def delete_tenant(
    tenant_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Permanently removes a promoter and its staff logins. Blocked if the
    promoter has any plots or bookings — that's real business data and
    should be handled deliberately (export/archive), not casually deleted."""
    result = await db.execute(select(Tenant).where(Tenant.id == tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    plot_count = len((await db.execute(select(Plot).where(Plot.tenant_id == tenant_id))).scalars().all())
    booking_count = len((await db.execute(select(Booking).where(Booking.tenant_id == tenant_id))).scalars().all())
    if plot_count > 0 or booking_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"Cannot delete — this promoter has {plot_count} plots and {booking_count} bookings. Remove their business data first.",
        )

    staff_result = await db.execute(select(User).where(User.tenant_id == tenant_id))
    for staff in staff_result.scalars().all():
        await db.delete(staff)

    await db.delete(tenant)
    await db.commit()
    return {"status": "deleted"}


@router.get("/my-plan")
async def my_plan(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER, UserRole.SALES_EXECUTIVE, UserRole.ACCOUNTANT, UserRole.SITE_SUPERVISOR)),
):
    """Self-service — any staff member can see their own promoter's current
    plan, expiry, and change history. No platform-admin role required,
    since this is about MY OWN subscription, not someone else's."""
    result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = result.scalar_one_or_none()
    if not tenant:
        raise HTTPException(status_code=404, detail="Tenant not found")

    days_to_expiry = None
    if tenant.subscription_expires_at:
        days_to_expiry = (tenant.subscription_expires_at - date.today()).days

    history_result = await db.execute(
        select(TenantPlanHistory).where(TenantPlanHistory.tenant_id == tenant.id).order_by(TenantPlanHistory.created_at.desc())
    )
    history = history_result.scalars().all()

    return {
        "company_name": tenant.company_name,
        "subscription_plan": tenant.subscription_plan,
        "subscription_expires_at": tenant.subscription_expires_at,
        "days_to_expiry": days_to_expiry,
        "is_active": tenant.is_active,
        "history": [
            {
                "old_plan": h.old_plan,
                "new_plan": h.new_plan,
                "old_expires_at": h.old_expires_at,
                "new_expires_at": h.new_expires_at,
                "changed_at": h.created_at,
            }
            for h in history
        ],
    }


@router.get("/all-plan-history")
async def get_all_plan_history(
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    """Consolidated subscription history across every promoter, for the
    Supreme Admin's dedicated 'Subscription History' page — not buried
    inside individual promoter cards."""
    result = await db.execute(
        select(TenantPlanHistory).order_by(TenantPlanHistory.created_at.desc())
    )
    history = result.scalars().all()

    out = []
    for h in history:
        tenant_result = await db.execute(select(Tenant).where(Tenant.id == h.tenant_id))
        tenant = tenant_result.scalar_one_or_none()
        out.append({
            "id": str(h.id),
            "company_name": tenant.company_name if tenant else "Unknown",
            "old_plan": h.old_plan,
            "new_plan": h.new_plan,
            "old_expires_at": h.old_expires_at,
            "new_expires_at": h.new_expires_at,
            "changed_by_email": h.changed_by_email,
            "changed_at": h.created_at,
        })
    return out


# ---------- Self-service plan upgrade (promoter pays OS2 directly) ----------

class UpgradeOrderRequest(BaseModel):
    plan_key: str


@router.post("/upgrade-plan/create-order")
async def create_upgrade_order(
    payload: UpgradeOrderRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    """Org admin self-service: pay OS2 directly to upgrade their own plan.
    Uses the same Razorpay credentials as customer payments — set
    RAZORPAY_KEY_ID/RAZORPAY_KEY_SECRET as environment variables to enable.
    Without them, this returns a clear 'not configured yet' message rather
    than a confusing failure."""
    from app.core.config import settings
    from app.models.subscription_plan_config import SubscriptionPlanConfig
    from app.models.platform_payment_order import PlatformPaymentOrder

    if not settings.RAZORPAY_KEY_ID or not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(
            status_code=503,
            detail="Online plan upgrades aren't set up yet. Contact OS2 Studio directly to upgrade your plan.",
        )

    plan_result = await db.execute(select(SubscriptionPlanConfig).where(SubscriptionPlanConfig.plan_key == payload.plan_key))
    plan = plan_result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")

    import razorpay
    client = razorpay.Client(auth=(settings.RAZORPAY_KEY_ID, settings.RAZORPAY_KEY_SECRET))
    amount_paise = int(plan.price * 100)
    rp_order = client.order.create({
        "amount": amount_paise,
        "currency": plan.currency,
        "notes": {"tenant_id": str(user.tenant_id), "plan_key": payload.plan_key, "purpose": "platform_subscription_upgrade"},
    })

    order = PlatformPaymentOrder(
        tenant_id=user.tenant_id,
        plan_key=payload.plan_key,
        amount=plan.price,
        razorpay_order_id=rp_order["id"],
    )
    db.add(order)
    await db.commit()

    return {
        "razorpay_order_id": rp_order["id"],
        "razorpay_key_id": settings.RAZORPAY_KEY_ID,
        "amount": amount_paise,
        "currency": plan.currency,
    }


class UpgradeVerifyRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str


@router.post("/upgrade-plan/verify-payment")
async def verify_upgrade_payment(
    payload: UpgradeVerifyRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(require_roles(UserRole.ORG_ADMIN)),
):
    import hmac
    import hashlib
    from app.core.config import settings
    from app.models.platform_payment_order import PlatformPaymentOrder, PlatformOrderStatus

    if not settings.RAZORPAY_KEY_SECRET:
        raise HTTPException(status_code=503, detail="Payment gateway not configured")

    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"
    expected_signature = hmac.new(settings.RAZORPAY_KEY_SECRET.encode(), body.encode(), hashlib.sha256).hexdigest()
    if not hmac.compare_digest(expected_signature, payload.razorpay_signature):
        raise HTTPException(status_code=400, detail="Payment signature verification failed")

    order_result = await db.execute(
        select(PlatformPaymentOrder).where(PlatformPaymentOrder.razorpay_order_id == payload.razorpay_order_id)
    )
    order = order_result.scalar_one_or_none()
    if not order or order.tenant_id != user.tenant_id:
        raise HTTPException(status_code=404, detail="Order not found")
    if order.status == PlatformOrderStatus.PAID:
        return {"status": "already_processed"}

    order.status = PlatformOrderStatus.PAID

    tenant_result = await db.execute(select(Tenant).where(Tenant.id == user.tenant_id))
    tenant = tenant_result.scalar_one_or_none()
    if tenant:
        history = TenantPlanHistory(
            tenant_id=tenant.id,
            old_plan=tenant.subscription_plan.value if tenant.subscription_plan else None,
            new_plan=order.plan_key,
            old_expires_at=tenant.subscription_expires_at,
            new_expires_at=None,  # set below
            changed_by_email=f"{user.email} (self-service payment)",
        )
        tenant.subscription_plan = order.plan_key
        tenant.subscription_started_at = date.today()
        from datetime import timedelta
        tenant.subscription_expires_at = date.today() + timedelta(days=30)
        history.new_expires_at = tenant.subscription_expires_at
        db.add(history)

    await db.commit()
    return {"status": "success", "new_plan": order.plan_key}
