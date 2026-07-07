import uuid
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.core.database import get_db
from app.core.security import decode_access_token
from app.models.user import User, UserRole

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/api/auth/login")


async def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: AsyncSession = Depends(get_db),
) -> User:
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    payload = decode_access_token(token)
    if payload is None:
        raise credentials_exception

    user_id = payload.get("sub")
    if user_id is None:
        raise credentials_exception

    result = await db.execute(select(User).where(User.id == uuid.UUID(user_id)))
    user = result.scalar_one_or_none()
    if user is None or not user.is_active:
        raise credentials_exception
    return user


def require_roles(*allowed_roles: UserRole):
    """Usage: Depends(require_roles(UserRole.ORG_ADMIN, UserRole.SALES_MANAGER))
    PLATFORM_ADMIN always passes — OS2 team can access any tenant for support."""
    async def checker(user: User = Depends(get_current_user)) -> User:
        if user.role == UserRole.PLATFORM_ADMIN:
            return user
        if user.role not in allowed_roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You don't have permission to perform this action",
            )
        return user
    return checker


def get_tenant_id(user: User = Depends(get_current_user)) -> uuid.UUID:
    """Every tenant-scoped router depends on this to get the tenant_id to
    filter/write with. NEVER trust a tenant_id passed in a request body/query —
    always derive it from the authenticated user's own record."""
    return user.tenant_id
