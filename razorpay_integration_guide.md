# Softkart - Razorpay Payment Gateway Integration Guide

This guide outlines the step-by-step instructions to replace the simulated payment checkout in Softkart with your actual Razorpay merchant account once your account setup is complete.

---

## 1. Prerequisites
Before starting the code integration, you will need:
- An approved **Razorpay Merchant Account** (Live mode).
- Your Razorpay API credentials:
  - **Key ID** (Public - used on the frontend).
  - **Key Secret** (Private - kept secure on the backend).

---

## 2. Configuration Settings

### Step A: Update Backend Configuration
Add your credentials to `backend/.env`:
```bash
RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_KEY_ID
RAZORPAY_KEY_SECRET=YOUR_ACTUAL_KEY_SECRET
```

### Step B: Update Frontend Configuration
Add your public Key ID to `frontend/.env.local` or environment configs:
```bash
NEXT_PUBLIC_RAZORPAY_KEY_ID=rzp_live_YOUR_ACTUAL_KEY_ID
```

---

## 3. Backend Implementation (FastAPI)

### Step 1: Install razorpay SDK
Install the official Python integration library:
```bash
pip install razorpay
```

### Step 2: Create Payment Endpoints
Create a new file `backend/app/routes/payments.py` (and register it in `backend/app/main.py`):
```python
import os
import razorpay
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db

router = APIRouter(prefix="/api/payments", tags=["payments"])

# Initialize client
client = razorpay.Client(auth=(os.getenv("RAZORPAY_KEY_ID"), os.getenv("RAZORPAY_KEY_SECRET")))

@router.post("/create-order")
def create_order(amount: float, currency: str = "INR"):
    """
    Creates a transaction order on Razorpay servers.
    Razorpay expects the amount in paisa (1 INR = 100 Paisa).
    """
    try:
        data = {
            "amount": int(amount * 100), 
            "currency": currency,
            "payment_capture": 1 # Auto-capture payments
        }
        order = client.order.create(data=data)
        return {
            "id": order["id"],
            "amount": order["amount"],
            "currency": order["currency"]
        }
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/verify-payment")
def verify_payment(
    razorpay_order_id: str,
    razorpay_payment_id: str,
    razorpay_signature: str
):
    """
    Verifies the signature returned by the Razorpay popup to ensure security.
    """
    params_dict = {
        'razorpay_order_id': razorpay_order_id,
        'razorpay_payment_id': razorpay_payment_id,
        'razorpay_signature': razorpay_signature
    }
    try:
        client.utility.verify_payment_signature(params_dict)
        return {"status": "success", "message": "Payment verified."}
    except Exception:
        raise HTTPException(status_code=400, detail="Invalid signature. Payment could not be verified.")
```

---

## 4. Frontend Integration (Next.js)

### Step 1: Load Checkout Script
In [purchase/[id]/page.tsx](file:///c:/Users/Nithyananthan/Desktop/SoftComerce/frontend/app/marketplace/purchase/%5Bid%5D/page.tsx), load the SDK script dynamically on mount:
```typescript
useEffect(() => {
  const script = document.createElement("script");
  script.src = "https://checkout.razorpay.com/v1/checkout.js";
  script.async = true;
  document.body.appendChild(script);
}, []);
```

### Step 2: Open Checkout Gateway Window
Replace `handleSimulatePayment` inside [purchase/[id]/page.tsx](file:///c:/Users/Nithyananthan/Desktop/SoftComerce/frontend/app/marketplace/purchase/%5Bid%5D/page.tsx) with a trigger utilizing the Razorpay window widget:
```typescript
const handleActualPayment = async () => {
  setPaying(true);
  try {
    // 1. Create Order on Backend
    const orderRes = await fetch(`/api/payments/create-order?amount=${product.priceVal}`);
    const orderData = await orderRes.json();

    // 2. Options configuration
    const options = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID, 
      amount: orderData.amount, 
      currency: orderData.currency,
      name: "NITECHSPARK",
      description: `Purchase License for ${product.name}`,
      order_id: orderData.id,
      handler: async function (response: any) {
        // 3. User paid! Verify signature
        const verifyRes = await fetch("/api/payments/verify-payment", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            razorpay_order_id: response.razorpay_order_id,
            razorpay_payment_id: response.razorpay_payment_id,
            razorpay_signature: response.razorpay_signature,
          }),
        });
        
        const verification = await verifyRes.json();
        if (verification.status === "success") {
          // Record purchase and complete success callback
          await purchaseMarketplaceProduct(product.id, {
            buyer_name: buyerName,
            buyer_email: buyerEmail,
            shipping_address: address,
            amount: product.priceVal,
            payment_id: response.razorpay_payment_id
          });
          
          setSuccess(true);
          setShowRazorpay(false);
        }
      },
      prefill: {
        name: buyerName,
        email: buyerEmail,
      },
      theme: {
        color: "#F97316", // Brand Orange
      },
    };

    const rzp = new (window as any).Razorpay(options);
    rzp.open();
  } catch (err: any) {
    alert("Payment initialization failed: " + err.message);
  } finally {
    setPaying(false);
  }
};
```
