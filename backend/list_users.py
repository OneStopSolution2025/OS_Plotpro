import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from app.models.tenant import Tenant
from sqlalchemy import select

async def main():
    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User))
        users = result.scalars().all()
        if not users:
            print("No users exist at all.")
            return
        for u in users:
            tenant_result = await db.execute(select(Tenant).where(Tenant.id == u.tenant_id))
            tenant = tenant_result.scalar_one_or_none()
            tenant_name = tenant.company_name if tenant else "?"
            print(f"{u.email}  |  role: {u.role.value}  |  tenant: {tenant_name}  |  active: {u.is_active}")

asyncio.run(main())