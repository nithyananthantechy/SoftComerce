from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    database_url: str = "postgresql://user:password@localhost:5432/softcomerce"
    # AI providers — Groq is primary, Gemini is fallback
    groq_api_key: str = ""
    gemini_api_key: str = ""
    # Legacy Anthropic key kept for backward compat (ignored if Groq/Gemini set)
    anthropic_api_key: str = ""
    admin_username: str = "admin"
    admin_password: str = "admin"
    session_secret: str = "dev-secret-change-me"
    admin_email: str = "nithyananthan@nskgroups.website"
    from_email: str = "noreply@nskgroups.website"
    sendgrid_api_key: str = ""
    smtp_host: str = ""
    smtp_port: int = 587
    smtp_user: str = ""
    smtp_password: str = ""
    propotrack_webhook_url: str = ""
    propotrack_webhook_secret: str = ""
    frontend_url: str = "http://localhost:3000"
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"

    @property
    def cors_origin_list(self) -> list[str]:
        return [o.strip() for o in self.cors_origins.split(",") if o.strip()]

    @property
    def has_ai(self) -> bool:
        return bool(self.groq_api_key or self.gemini_api_key or self.anthropic_api_key)


settings = Settings()
