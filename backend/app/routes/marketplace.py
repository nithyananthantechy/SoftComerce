from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Client, VendorProduct, ServicePricing, MarketplacePurchase
from app.schemas import (
    VendorProductCreate,
    VendorProductOut,
    ServicePricingOut,
    MarketplacePurchaseCreate,
    MarketplacePurchaseOut,
    BankDetailsUpdate,
)
from app.routes.client_auth import verify_client_session
from app.services.email_service import send_demo_request_alert

router = APIRouter(prefix="/api/marketplace", tags=["marketplace"])


@router.get("/products", response_model=list[VendorProductOut])
def get_public_products(db: Session = Depends(get_db)):
    """Fetch all approved and paid vendor products for the public marketplace."""
    return (
        db.query(VendorProduct)
        .filter(VendorProduct.status == "live")
        .filter(VendorProduct.payment_status == "paid")
        .order_by(VendorProduct.created_at.desc())
        .all()
    )


@router.get("/services", response_model=list[ServicePricingOut])
def get_public_services(db: Session = Depends(get_db)):
    """Fetch all available infrastructure & support services."""
    return db.query(ServicePricing).order_by(ServicePricing.id.asc()).all()


@router.post("/vendor/products", response_model=VendorProductOut)
def create_vendor_product(
    body: VendorProductCreate,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db),
):
    """Submit a new product (only for sellers)."""
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()

    if not client or not client.is_seller:
        raise HTTPException(status_code=403, detail="Only sellers can submit products")

    product = VendorProduct(
        vendor_id=client_id,
        name=body.name,
        tagline=body.tagline,
        description=body.description,
        features=body.features,
        currency=body.currency,
        price=body.price,
        pricing_model=body.pricing_model,
        need_server=body.need_server,
        version=body.version or "1.0.0",
        selected_services=body.selected_services or {},
        demo_video_url=body.demo_video_url,
        payment_status="unpaid",
        status="pending_approval",
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@router.put("/vendor/products/{product_id}", response_model=VendorProductOut)
def update_vendor_product(
    product_id: int,
    body: VendorProductCreate,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db),
):
    """Edit an existing product (only for the product owner)."""
    client_id = session.get("client_id")
    product = db.query(VendorProduct).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.vendor_id != client_id:
        raise HTTPException(status_code=403, detail="Not authorized to edit this product")

    product.name = body.name
    product.tagline = body.tagline
    product.description = body.description
    product.features = body.features
    product.currency = body.currency
    product.price = body.price
    product.pricing_model = body.pricing_model
    product.need_server = body.need_server
    product.version = body.version or "1.0.0"
    product.selected_services = body.selected_services or {}
    product.demo_video_url = body.demo_video_url
    
    # Reset status to pending_approval for review on edit, and set payment to unpaid
    product.status = "pending_approval"
    product.payment_status = "unpaid"
    
    db.commit()
    db.refresh(product)
    return product


@router.get("/vendor/my-products", response_model=list[VendorProductOut])
def get_my_products(
    session: dict = Depends(verify_client_session), db: Session = Depends(get_db)
):
    """Fetch all products submitted by the logged-in seller."""
    client_id = session.get("client_id")
    return (
        db.query(VendorProduct)
        .filter(VendorProduct.vendor_id == client_id)
        .order_by(VendorProduct.created_at.desc())
        .all()
    )


@router.post("/products/{product_id}/request-demo")
async def request_product_demo(
    product_id: int,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    """Alert/email the seller that a client wants a demo of their marketplace product."""
    client_id = session.get("client_id")
    buyer = db.query(Client).filter(Client.id == client_id).first()
    product = db.query(VendorProduct).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    seller = db.query(Client).filter(Client.id == product.vendor_id).first()
    if not seller:
        raise HTTPException(status_code=404, detail="Seller not found")
    
    # Send actual email to seller
    await send_demo_request_alert(product, seller, buyer)
    
    return {"ok": True, "message": "Demo request sent to seller"}


@router.post("/products/{product_id}/purchase", response_model=MarketplacePurchaseOut)
def register_product_purchase(
    product_id: int,
    body: MarketplacePurchaseCreate,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    """Log a successful purchase in the platform escrow."""
    client_id = session.get("client_id")
    product = db.query(VendorProduct).filter(VendorProduct.id == product_id).first()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    
    purchase = MarketplacePurchase(
        product_id=product_id,
        buyer_id=client_id,
        buyer_name=body.buyer_name,
        buyer_email=body.buyer_email,
        shipping_address=body.shipping_address,
        amount=body.amount,
        payment_id=body.payment_id,
        status="completed"
    )
    db.add(purchase)
    db.commit()
    db.refresh(purchase)
    return purchase


@router.get("/vendor/earnings")
def get_vendor_earnings(
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    """Calculate total product sales, earnings, list bank details and order history."""
    client_id = session.get("client_id")
    vendor = db.query(Client).filter(Client.id == client_id).first()
    if not vendor or not vendor.is_seller:
        raise HTTPException(status_code=403, detail="Only sellers can access earnings")
    
    # Get all products owned by this seller
    products = db.query(VendorProduct).filter(VendorProduct.vendor_id == client_id).all()
    product_ids = [p.id for p in products]
    
    # Query all orders made for these products
    orders = []
    if product_ids:
        orders = (
            db.query(MarketplacePurchase)
            .filter(MarketplacePurchase.product_id.in_(product_ids))
            .order_by(MarketplacePurchase.created_at.desc())
            .all()
        )
    
    total_sales = len(orders)
    total_earnings = sum(float(o.amount) for o in orders)
    
    # Format orders to include product names
    formatted_orders = []
    for o in orders:
        prod = next((p for p in products if p.id == o.product_id), None)
        formatted_orders.append({
            "id": o.id,
            "product_name": prod.name if prod else "Unknown Product",
            "buyer_name": o.buyer_name,
            "buyer_email": o.buyer_email,
            "amount": float(o.amount),
            "payment_id": o.payment_id,
            "status": o.status,
            "created_at": o.created_at
        })
        
    return {
        "total_sales": total_sales,
        "total_earnings": total_earnings,
        "bank_details": vendor.bank_details or {},
        "orders": formatted_orders
    }


@router.post("/vendor/bank-details")
def update_vendor_bank_details(
    body: BankDetailsUpdate,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    """Save or update the seller's bank payout details."""
    client_id = session.get("client_id")
    vendor = db.query(Client).filter(Client.id == client_id).first()
    if not vendor or not vendor.is_seller:
        raise HTTPException(status_code=403, detail="Only sellers can register bank details")
        
    vendor.bank_details = {
        "bank_name": body.bank_name,
        "account_number": body.account_number,
        "ifsc_code": body.ifsc_code,
        "holder_name": body.holder_name,
        "upi_id": body.upi_id
    }
    db.commit()
    return {"ok": True, "message": "Payout bank details updated"}
