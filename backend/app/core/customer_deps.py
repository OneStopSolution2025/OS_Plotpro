import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.customer import Customer

customer_oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/customer-auth/verify-otp", auto_error=False)


async def get_current_customer(
    token: str | None = Depends(customer_oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> Customer:
    unauthorized = HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid or expired session")
    if not token:
        raise unauthorized

    payload = decode_access_token(token)
    if not payload or payload.get("type") != "customer":
        raise unauthorized

    customer_id = payload.get("sub")
    result = await db.execute(select(Customer).where(Customer.id == uuid.UUID(customer_id)))
    customer = result.scalar_one_or_none()
    if not customer:
        raise unauthorized
    return customer
