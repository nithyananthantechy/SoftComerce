from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Client, ProposalVersion, Request, VendorProduct, ServicePricing
from app.routes.auth import verify_session
from app.schemas import RequestOut, RequestSummary, VendorProductOut, ServicePricingCreate, ServicePricingOut
from app.services.email_service import LOCKED_MESSAGE, MAX_VERSIONS, send_confirmation_alert, send_human_review_alert
from app.services.propotrack import push_to_propotrack

router = APIRouter(prefix="/api/admin", tags=["admin"], dependencies=[Depends(verify_session)])


def _request_to_out(req: Request) -> RequestOut:
    version_count = len(req.proposal_versions)
    can_regenerate = version_count < MAX_VERSIONS and req.status == "pending"
    locked_message = None
    if version_count >= MAX_VERSIONS and req.status == "pending":
        locked_message = LOCKED_MESSAGE
    elif req.status == "needs_human_review":
        locked_message = LOCKED_MESSAGE

    return RequestOut(
        id=req.id,
        category=req.category,
        requirements_raw=req.requirements_raw,
        requirements_structured=req.requirements_structured,
        status=req.status,
        created_at=req.created_at,
        client=req.client,
        proposal_versions=req.proposal_versions,
        versions_remaining=max(0, MAX_VERSIONS - version_count),
        can_regenerate=can_regenerate,
        locked_message=locked_message,
    )


@router.get("/requests", response_model=list[RequestSummary])
def list_requests(
    category: str | None = None,
    status: str | None = None,
    date_from: datetime | None = None,
    date_to: datetime | None = None,
    db=Depends(get_db),
):
    q = db.query(Request).options(joinedload(Request.client), joinedload(Request.proposal_versions))

    if category:
        q = q.filter(Request.category == category)
    if status:
        q = q.filter(Request.status == status)
    if date_from:
        q = q.filter(Request.created_at >= date_from)
    if date_to:
        q = q.filter(Request.created_at <= date_to)

    requests = q.order_by(Request.created_at.desc()).all()
    summaries = []
    for req in requests:
        latest = req.proposal_versions[-1] if req.proposal_versions else None
        summaries.append(
            RequestSummary(
                id=req.id,
                category=req.category,
                status=req.status,
                created_at=req.created_at,
                client_id=req.client.id,
                client_name=req.client.name,
                client_email=req.client.email,
                client_phone=req.client.phone,
                client_company=req.client.company,
                latest_budget_min=float(latest.budget_min) if latest and latest.budget_min else None,
                latest_budget_max=float(latest.budget_max) if latest and latest.budget_max else None,
                version_count=len(req.proposal_versions),
            )
        )
    return summaries


@router.delete("/clients/{client_id}")
def delete_client(client_id: int, db=Depends(get_db)):
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    # Due to cascading or manual deletion, we must remove associated requests.
    # The models don't explicitly have cascade="all, delete" in models.py right now
    # so we delete manually to be safe.
    requests = db.query(Request).filter(Request.client_id == client_id).all()
    for req in requests:
        db.query(ProposalVersion).filter(ProposalVersion.request_id == req.id).delete()
    
    db.query(Request).filter(Request.client_id == client_id).delete()
    db.delete(client)
    db.commit()
    
    return {"ok": True, "message": "Client and associated data deleted"}


@router.get("/requests/{request_id}", response_model=RequestOut)
def get_request(request_id: int, db=Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    return _request_to_out(req)


@router.post("/requests/{request_id}/mark-needs-review")
async def mark_needs_review(request_id: int, db=Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")

    req.status = "needs_human_review"
    db.commit()
    await send_human_review_alert(db, req)
    return {"ok": True, "status": req.status}


@router.get("/requests/{request_id}/export-pdf")
def export_pdf(request_id: int, db=Depends(get_db)):
    from app.services.pdf_export import generate_proposal_pdf

    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    if req.status != "confirmed":
        raise HTTPException(status_code=400, detail="Only confirmed proposals can be exported")

    latest = req.proposal_versions[-1] if req.proposal_versions else None
    if not latest:
        raise HTTPException(status_code=400, detail="No proposal version found")

    pdf_buffer = generate_proposal_pdf(req, latest)
    filename = f"NITECHSPARK_Proposal_{req.client.name.replace(' ', '_')}_{request_id}.pdf"

    return StreamingResponse(
        pdf_buffer,
        media_type="application/pdf",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


# -- Admin Marketplace Routes --

@router.get("/marketplace/products", response_model=list[VendorProductOut])
def admin_get_marketplace_products(db=Depends(get_db)):
    products = db.query(VendorProduct).options(joinedload(VendorProduct.vendor)).order_by(VendorProduct.created_at.desc()).all()
    return products


@router.put("/marketplace/products/{product_id}/payment", response_model=VendorProductOut)
def admin_update_payment(product_id: int, status: str, db=Depends(get_db)):
    if status not in ["unpaid", "paid", "overdue"]:
        raise HTTPException(status_code=400, detail="Invalid payment status")
    
    product = db.query(VendorProduct).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.payment_status = status
    db.commit()
    db.refresh(product)
    return product


@router.put("/marketplace/products/{product_id}/status", response_model=VendorProductOut)
def admin_update_status(product_id: int, status: str, db=Depends(get_db)):
    if status not in ["pending_approval", "live", "rejected"]:
        raise HTTPException(status_code=400, detail="Invalid status")
        
    product = db.query(VendorProduct).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    product.status = status
    db.commit()
    db.refresh(product)
    return product


@router.post("/marketplace/products/{product_id}/notify-payment")
def admin_notify_payment(product_id: int, db=Depends(get_db)):
    product = db.query(VendorProduct).options(joinedload(VendorProduct.vendor)).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
        
    # In a real app, send an email to product.vendor.email
    print(f"Sent payment reminder email to {product.vendor.email} for product {product.name}")
    
    return {"ok": True, "message": "Payment reminder sent"}


# -- Admin Service Pricing Routes --

@router.get("/marketplace/services", response_model=list[ServicePricingOut])
def admin_get_services(db=Depends(get_db)):
    return db.query(ServicePricing).order_by(ServicePricing.id.asc()).all()


@router.post("/marketplace/services", response_model=ServicePricingOut)
def admin_create_service(body: ServicePricingCreate, db=Depends(get_db)):
    existing = db.query(ServicePricing).filter(ServicePricing.service_key == body.service_key).first()
    if existing:
        raise HTTPException(status_code=400, detail="Service key already exists")
    
    service = ServicePricing(
        service_key=body.service_key,
        service_name=body.service_name,
        price=body.price,
        pricing_model=body.pricing_model,
        description=body.description,
        currency=body.currency
    )
    db.add(service)
    db.commit()
    db.refresh(service)
    return service


@router.put("/marketplace/services/{service_id}", response_model=ServicePricingOut)
def admin_update_service(service_id: int, body: ServicePricingCreate, db=Depends(get_db)):
    service = db.query(ServicePricing).filter(ServicePricing.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    service.service_key = body.service_key
    service.service_name = body.service_name
    service.price = body.price
    service.pricing_model = body.pricing_model
    service.description = body.description
    service.currency = body.currency
    
    db.commit()
    db.refresh(service)
    return service


@router.delete("/marketplace/services/{service_id}")
def admin_delete_service(service_id: int, db=Depends(get_db)):
    service = db.query(ServicePricing).filter(ServicePricing.id == service_id).first()
    if not service:
        raise HTTPException(status_code=404, detail="Service not found")
    
    db.delete(service)
    db.commit()
    return {"ok": True, "message": "Service deleted"}
