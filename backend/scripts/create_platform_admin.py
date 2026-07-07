"""
Run this ONCE after your first migration to create the OS2 platform admin
account — the super-user that can onboard new tenants (promoters).

Usage:
    cd backend
    python -m scripts.create_platform_admin
"""
import asyncio
import uuid
import sys
import os

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.tenant import Tenant, SubscriptionPlan
from app.models.user import User, UserRole


async def main():
    email = input("Platform admin email: ").strip()
    password = input("Platform admin password: ").strip()
    full_name = input("Full name [OS2 Admin]: ").strip() or "OS2 Admin"

    async with AsyncSessionLocal() as db:
        # Platform admin still needs a tenant row to satisfy the FK —
        # this is OS2's own internal "tenant" record, not a real customer.
        os2_tenant = Tenant(
            company_name="OS2 Studio (Platform)",
            subdomain="os2-platform",
            contact_email=email,
            subscription_plan=SubscriptionPlan.ENTERPRISE,
        )
        db.add(os2_tenant)
        await db.flush()

        admin = User(
            tenant_id=os2_tenant.id,
            full_name=full_name,
            email=email,
            hashed_password=hash_password(password),
            role=UserRole.PLATFORM_ADMIN,
        )
        db.add(admin)
        await db.commit()
        print(f"Platform admin created: {email}")


if __name__ == "__main__":
    asyncio.run(main())
