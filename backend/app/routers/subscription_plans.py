from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from pydantic import BaseModel

from app.core.database import get_db
from app.core.deps import get_current_user, require_roles
from app.models.user import User, UserRole
from app.models.subscription_plan_config import SubscriptionPlanConfig

router = APIRouter(prefix="/api/subscription-plans", tags=["subscription plans"])

_DEFAULTS = [
    {"plan_key": "trial", "display_name": "Trial", "price": 0, "max_projects": 1, "max_staff": 3, "max_plots": 25,
     "description": "Free — try it out with limited usage", "features": "1 project,3 staff logins,25 plots,Email support"},
    {"plan_key": "basic", "display_name": "Basic", "price": 999, "max_projects": 1, "max_staff": 5, "max_plots": 100,
     "description": "For a single project, small team", "features": "1 project,5 staff logins,100 plots,WhatsApp reminders"},
    {"plan_key": "pro", "display_name": "Pro", "price": 2999, "max_projects": 5, "max_staff": 15, "max_plots": 500,
     "description": "Multiple projects, larger team", "features": "5 projects,15 staff logins,500 plots,Priority support,Online payments"},
    {"plan_key": "enterprise", "display_name": "Enterprise", "price": 7999, "max_projects": None, "max_staff": None, "max_plots": None,
     "description": "Unlimited, priority support", "features": "Unlimited projects,Unlimited staff,Unlimited plots,Dedicated support,Custom branding"},
]


async def _ensure_seeded(db: AsyncSession):
    existing = (await db.execute(select(SubscriptionPlanConfig))).scalars().all()
    existing_keys = {p.plan_key for p in existing}
    for d in _DEFAULTS:
        if d["plan_key"] not in existing_keys:
            db.add(SubscriptionPlanConfig(**d))
    if len(existing_keys) < len(_DEFAULTS):
        await db.commit()


@router.get("")
async def list_plans(
    db: AsyncSession = Depends(get_db),
    _user: User = Depends(get_current_user),
):
    """Any logged-in staff can view plan details (needed for the promoter's
    own 'My Plan' page) — only Supreme Admin can edit them."""
    await _ensure_seeded(db)
    result = await db.execute(select(SubscriptionPlanConfig).order_by(SubscriptionPlanConfig.price))
    plans = result.scalars().all()
    return [
        {
            "id": str(p.id),
            "plan_key": p.plan_key,
            "display_name": p.display_name,
            "price": p.price,
            "currency": p.currency,
            "billing_cycle": p.billing_cycle,
            "max_projects": p.max_projects,
            "max_staff": p.max_staff,
            "max_plots": p.max_plots,
            "description": p.description,
            "features": p.features.split(",") if p.features else [],
        }
        for p in plans
    ]


class PlanConfigUpdate(BaseModel):
    display_name: str | None = None
    price: float | None = None
    currency: str | None = None
    billing_cycle: str | None = None
    max_projects: int | None = None
    max_staff: int | None = None
    max_plots: int | None = None
    description: str | None = None
    features: str | None = None  # comma-separated on input


@router.patch("/{plan_key}")
async def update_plan_config(
    plan_key: str,
    payload: PlanConfigUpdate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_roles(UserRole.PLATFORM_ADMIN)),
):
    await _ensure_seeded(db)
    result = await db.execute(select(SubscriptionPlanConfig).where(SubscriptionPlanConfig.plan_key == plan_key))
    plan = result.scalar_one_or_none()
    if not plan:
        raise HTTPException(status_code=404, detail="Plan not found")
    for field, value in payload.model_dump(exclude_unset=True).items():
        setattr(plan, field, value)
    await db.commit()
    return {"status": "updated"}
