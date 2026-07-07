from sqlalchemy import String, Boolean, Enum
from sqlalchemy.orm import Mapped, mapped_column
import enum
from app.core.database import Base
from app.models.mixins import UUIDPKMixin, TenantScopedMixin, TimestampMixin


class UserRole(str, enum.Enum):
    PLATFORM_ADMIN = "platform_admin"   # OS2 team, super-user across all tenants
    ORG_ADMIN = "org_admin"             # Promoter's owner/admin
    SALES_MANAGER = "sales_manager"
    SALES_EXECUTIVE = "sales_executive"
    ACCOUNTANT = "accountant"
    SITE_SUPERVISOR = "site_supervisor"


class User(UUIDPKMixin, TenantScopedMixin, TimestampMixin, Base):
    """Staff / admin users. Customers are a separate table (customer.py)
    because they authenticate differently (OTP) and have a different data shape."""
    __tablename__ = "users"

    full_name: Mapped[str] = mapped_column(String(150), nullable=False)
    email: Mapped[str] = mapped_column(String(200), nullable=False, index=True)
    phone: Mapped[str] = mapped_column(String(20), nullable=True)
    hashed_password: Mapped[str] = mapped_column(String(255), nullable=False)
    role: Mapped[UserRole] = mapped_column(Enum(UserRole), default=UserRole.SALES_EXECUTIVE)
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)

    # Sales staff target/commission fields
    monthly_target: Mapped[int] = mapped_column(default=0)
    commission_percent: Mapped[float] = mapped_column(default=0.0)
