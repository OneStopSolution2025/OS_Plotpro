import asyncio
from app.core.database import AsyncSessionLocal
from app.models.user import User
from sqlalchemy import select

async def main():
    email = "sample@sam.com"

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found with that email.")
            return
        await db.delete(user)
        await db.commit()
        print(f"Deleted user: {email}")

asyncio.run(main())