from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    APP_NAME: str = "OS2 PlotPro"
    ENV: str = "development"

    # Postgres (Railway gives you a DATABASE_URL directly — just paste it here)
    DATABASE_URL: str = "postgresql+asyncpg://user:password@localhost:5432/plotpro"

    # JWT
    JWT_SECRET: str = "change-this-secret-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours

    # Super admin (platform owner - OS2, not a tenant)
    PLATFORM_ADMIN_EMAIL: str = "admin@os2studio.com"

    class Config:
        env_file = ".env"


settings = Settings()
