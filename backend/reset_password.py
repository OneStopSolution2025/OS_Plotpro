import asyncio
from app.core.database import AsyncSessionLocal
from app.core.security import hash_password
from app.models.user import User
from sqlalchemy import select

async def main():
    email = "youradmin@example.com"
    new_password = "dream123456"  # change this to whatever you want

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()
        if not user:
            print("No user found.")
            return
        user.hashed_password = hash_password(new_password)
        await db.commit()
        print(f"Password reset for {email}")

asyncio.run(main())