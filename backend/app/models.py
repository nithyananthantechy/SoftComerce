from datetime import datetime

from sqlalchemy import (
    CheckConstraint,
    DateTime,
    ForeignKey,
    Integer,
    Numeric,
    String,
    Text,
    func,
)
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base


class Client(Base):
    __tablename__ = "clients"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    name: Mapped[str] = mapped_column(Text, nullable=False)
    email: Mapped[str] = mapped_column(Text, nullable=False)
    password_hash: Mapped[str | None] = mapped_column(Text)
    phone: Mapped[str | None] = mapped_column(Text)
    company: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    requests: Mapped[list["Request"]] = relationship(back_populates="client")


class Request(Base):
    __tablename__ = "requests"
    __table_args__ = (
        CheckConstraint(
            "category IN ('web', 'mobile', 'custom_software')", name="ck_requests_category"
        ),
        CheckConstraint(
            "status IN ('pending', 'confirmed', 'needs_human_review', 'abandoned')",
            name="ck_requests_status",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    client_id: Mapped[int] = mapped_column(Integer, ForeignKey("clients.id"), nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    requirements_raw: Mapped[str] = mapped_column(Text, nullable=False)
    requirements_structured: Mapped[dict | None] = mapped_column(JSONB)
    status: Mapped[str] = mapped_column(Text, server_default="pending")
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    client: Mapped["Client"] = relationship(back_populates="requests")
    proposal_versions: Mapped[list["ProposalVersion"]] = relationship(
        back_populates="request", order_by="ProposalVersion.version_number"
    )
    alerts: Mapped[list["Alert"]] = relationship(back_populates="request")


class ProposalVersion(Base):
    __tablename__ = "proposal_versions"

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("requests.id"), nullable=False)
    version_number: Mapped[int] = mapped_column(Integer, nullable=False)
    scope_breakdown: Mapped[list | None] = mapped_column(JSONB)
    budget_min: Mapped[float | None] = mapped_column(Numeric)
    budget_max: Mapped[float | None] = mapped_column(Numeric)
    timeline_estimate: Mapped[str | None] = mapped_column(Text)
    assumptions: Mapped[str | None] = mapped_column(Text)
    exclusions: Mapped[str | None] = mapped_column(Text)
    client_feedback: Mapped[str | None] = mapped_column(Text)
    created_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())

    request: Mapped["Request"] = relationship(back_populates="proposal_versions")


class RateCard(Base):
    __tablename__ = "rate_card"
    __table_args__ = (
        CheckConstraint(
            "complexity_tier IN ('simple', 'medium', 'complex')",
            name="ck_rate_card_complexity",
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    component_name: Mapped[str] = mapped_column(Text, nullable=False)
    complexity_tier: Mapped[str] = mapped_column(Text, nullable=False)
    base_price: Mapped[float] = mapped_column(Numeric, nullable=False)
    unit: Mapped[str | None] = mapped_column(Text)


class Alert(Base):
    __tablename__ = "alerts"
    __table_args__ = (
        CheckConstraint(
            "alert_type IN ('confirmed', 'needs_human_review')", name="ck_alerts_type"
        ),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True)
    request_id: Mapped[int] = mapped_column(Integer, ForeignKey("requests.id"), nullable=False)
    alert_type: Mapped[str] = mapped_column(Text, nullable=False)
    sent_at: Mapped[datetime] = mapped_column(DateTime, server_default=func.now())
    email_status: Mapped[str] = mapped_column(Text, server_default="pending")

    request: Mapped["Request"] = relationship(back_populates="alerts")
