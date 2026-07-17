from datetime import datetime
from typing import Any, Literal

from pydantic import BaseModel, EmailStr, Field


Category = Literal["web", "mobile", "custom_software"]
RequestStatus = Literal["pending", "confirmed", "needs_human_review", "abandoned"]
FeedbackReason = Literal[
    "budget_too_high",
    "need_more_features",
    "wrong_timeline",
    "scope_incorrect",
    "other",
]


class WebRequirements(BaseModel):
    number_of_pages: int | None = None
    ecommerce_needed: bool = False
    cms_needed: bool = False
    hosting_needed: bool = False
    domain_ssl_needed: bool = False


class MobileRequirements(BaseModel):
    platforms: list[Literal["ios", "android", "both"]] = Field(default_factory=list)
    backend_needed: bool = False
    push_notifications: bool = False
    payment_integration: bool = False


class CustomSoftwareRequirements(BaseModel):
    integrations: list[str] = Field(default_factory=list)
    automation_ai_features: bool = False
    expected_user_count: str | None = None
    data_storage_needs: str | None = None


class StructuredRequirements(BaseModel):
    project_description: str
    budget_expectation: str | None = None
    timeline_expectation: str | None = None
    must_have_features: list[str] = Field(default_factory=list)
    must_have_features_text: str | None = None
    web: WebRequirements | None = None
    mobile: MobileRequirements | None = None
    custom_software: CustomSoftwareRequirements | None = None


class ClientCreate(BaseModel):
    name: str
    email: EmailStr
    password: str | None = None
    phone: str
    company: str


class ClientLogin(BaseModel):
    email: EmailStr
    password: str


class RequestCreate(BaseModel):
    category: Category
    requirements_raw: str
    requirements_structured: StructuredRequirements


class ProposalOutput(BaseModel):
    scope_breakdown: list[str]
    budget_min: float
    budget_max: float
    timeline_estimate: str
    assumptions: str
    exclusions: str


class ProposalVersionOut(BaseModel):
    id: int
    version_number: int
    scope_breakdown: list[str] | None
    budget_min: float | None
    budget_max: float | None
    timeline_estimate: str | None
    assumptions: str | None
    exclusions: str | None
    client_feedback: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class ClientOut(BaseModel):
    id: int
    name: str
    email: str
    phone: str | None
    company: str | None
    is_seller: bool = False
    is_email_verified: bool = False
    is_phone_verified: bool = False
    created_at: datetime | None = None

    model_config = {"from_attributes": True}


class RequestOut(BaseModel):
    id: int
    category: Category
    requirements_raw: str
    requirements_structured: dict[str, Any] | None
    status: RequestStatus
    created_at: datetime
    client: ClientOut
    proposal_versions: list[ProposalVersionOut] = []
    versions_remaining: int = 0
    can_regenerate: bool = True
    locked_message: str | None = None

    model_config = {"from_attributes": True}


class RequestSummary(BaseModel):
    id: int
    category: Category
    status: RequestStatus
    created_at: datetime
    client_id: int
    client_name: str
    client_email: str
    client_phone: str | None = None
    client_company: str | None
    latest_budget_min: float | None
    latest_budget_max: float | None
    version_count: int


class FeedbackCreate(BaseModel):
    feedback_reason: FeedbackReason
    feedback_text: str = Field(..., min_length=10)


class ConfirmRequest(BaseModel):
    confirmed: bool = True


class AdminLogin(BaseModel):
    username: str
    password: str


class RateCardOut(BaseModel):
    id: int
    category: str
    component_name: str
    complexity_tier: str
    base_price: float
    unit: str | None

    model_config = {"from_attributes": True}


class DemoRequest(BaseModel):
    name: str
    email: EmailStr
    contact: str
    product_name: str
    meeting_time: str


class VendorProductCreate(BaseModel):
    name: str
    tagline: str | None = None
    description: str | None = None
    features: list[str] = Field(default_factory=list)
    currency: str = "USD"
    price: str | None = None
    pricing_model: str = "per_month"
    need_server: bool = False
    version: str | None = "1.0.0"
    selected_services: dict | None = None
    demo_video_url: str | None = None


class VendorProductOut(BaseModel):
    id: int
    vendor_id: int
    name: str
    tagline: str | None
    description: str | None
    features: list[str] | None
    currency: str
    price: str | None
    pricing_model: str
    need_server: bool
    payment_status: str
    status: str
    version: str | None
    selected_services: dict | None
    demo_video_url: str | None
    created_at: datetime
    
    vendor: ClientOut | None = None

    model_config = {"from_attributes": True}


class ServicePricingCreate(BaseModel):
    service_key: str
    service_name: str
    price: float
    pricing_model: str = "one_time"
    description: str | None = None
    currency: str = "USD"


class ServicePricingOut(BaseModel):
    id: int
    service_key: str
    service_name: str
    price: float
    pricing_model: str
    description: str | None
    currency: str

    model_config = {"from_attributes": True}


class MarketplacePurchaseCreate(BaseModel):
    buyer_name: str
    buyer_email: str
    shipping_address: str
    amount: float
    payment_id: str | None = None


class MarketplacePurchaseOut(BaseModel):
    id: int
    product_id: int
    buyer_id: int
    buyer_name: str
    buyer_email: str
    shipping_address: str
    amount: float
    payment_id: str | None
    status: str
    created_at: datetime
    
    product: VendorProductOut | None = None

    model_config = {"from_attributes": True}


class BankDetailsUpdate(BaseModel):
    bank_name: str
    account_number: str
    ifsc_code: str
    holder_name: str
    upi_id: str | None = None


class ForgotPasswordRequest(BaseModel):
    email: str


class ResetPasswordVerify(BaseModel):
    email: str
    otp: str
    new_password: str


class ProfileUpdate(BaseModel):
    name: str
    company: str | None = None
    phone: str | None = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class EmailChangeRequest(BaseModel):
    new_email: str


class EmailChangeVerify(BaseModel):
    otp: str


class VerifyPasswordChange(BaseModel):
    current_password: str
    new_password: str
    otp: str


class RegisterVerify(BaseModel):
    email: str
    otp: str

