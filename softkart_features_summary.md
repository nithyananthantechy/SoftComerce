# Softkart - Software Marketplace & Client Portal Summary

This document summarizes the core features, use cases, modules, and architecture currently implemented in Softkart.

---

## 1. Core Modules

### 🏪 Third-Party Marketplace
- **Public Product Listings Grid**: Renders vendor-submitted software applications and tools dynamically.
- **Dual-Action Purchase Flow**:
  - **Request Demo**: Buyers can request a product demo. It displays immediate visual feedback and sends an email notification directly to the seller (logged/printed in backend terminal).
  - **Purchase License (Softpurchase)**: Routes the buyer to a secure payment portal where they enter shipping, delivery, and billing details.
- **Dynamic Pricing Suffixes**: Handles billing frequencies dynamically from the database (`/mo`, `/yr`, `one-time`, `custom`).

### 💳 Softpurchase & Payment Simulator
- **Razorpay Checkout Drawer Simulator**: Mimics a standard Razorpay modal branded under **NITECHSPARK Gateways**.
- **Simulated Transactions**: Supports paying with cards, netbanking, UPI, and wallets with realistic load animations.
- **License Code Generator**: Dynamically generates unique product license keys (e.g. `SOFT-K3S2-8H4A-P8D2`) and issues a success screen.

### 👤 Seller (Vendor) Portal & Dashboard
- **Marketplace Listing Management**: Sellers can view their products, check status badges (`live`, `pending_approval`, `rejected`), and review verification fees.
- **Interactive Edit Modal**: Sellers can edit features, version numbers, prices, taglines, and description details. Editing resets the product state to `pending_approval` for admin review.
- **Escrow Financials & Balance Tracker**:
  - Displays total sales revenue ($ / INR) and count of sold licenses.
  - Lists sales order logs (Order ID, buyer name, email, transaction timestamp, payment amount).
- **Payout Bank Details Setup**: A form enabling sellers to register Bank Name, Account Holder Name, Account Number, IFSC, and UPI ID for manual disbursements.

### 💼 Client (Buyer) Dashboard
- **Custom Development Proposals**: Clients can submit requests for custom applications.
- **Request Tracking Cards**: Displays custom cards for each development proposal with stage alerts, emojis, chevrons, and timeline metrics.
- **Meeting Scheduler & Exporter**: Features proposal detail dashboards, Zoom/Google Meet booking integration, and PDF report exporting.

### 🛠️ Administrator Dashboard
- **Tab-Based Management Panel**:
  - **🏪 Product Listings Tab**: View all products, mark platform fees as paid (triggering Zoho billing), and toggle approval status to live.
  - **⚙️ Support Service Options Tab**: Full-page manager to add, edit, and delete optional infrastructure services (e.g. Server setups, AI ticketing bots, dedicated support technicians).
- **Dynamic Service Pricing**: Allows configuring specific price models (One-Time, Monthly, Per User) and detail descriptions that update the vendor submission checklist instantly.

---

## 2. Key Use Cases

1. **Third-Party Product Showcase**: A software developer registers as a seller on Softkart, submits their tool with specific custom parameters, version details, and support packages, pays a standard listing fee, and goes live on the marketplace.
2. **Client License Purchase**: A corporate buyer browse the marketplace, finds a CRM tool, fills in their company address, pays via the simulator, and instantly receives their secure license key.
3. **Escrow Manual Payout**: Softkart admin collects all marketplace payments under the central account, tracks each seller's earnings, verifies bank account coordinates registered by vendors, and manually transfers payouts offline.
4. **Interactive Demos**: Buyers can request a live product demo, which notifies the seller immediately so they can schedule a walkthrough session.
5. **Custom Software Contracting**: Clients draft and submit detailed requirements for bespoke custom projects, monitor milestones, and view proposals directly in their workspace.

---

## 3. Technology Stack & Frameworks
- **Frontend**: Next.js 15 (React 19), TypeScript, Tailwind CSS, Vanilla CSS animations.
- **Backend**: FastAPI (Python), SQLAlchemy ORM, Uvicorn, PostgreSQL.
- **Branding**: Exclusively branded under **NITECHSPARK** with custom logos, cyber-glow design systems, and responsive viewport sizing.
