"""Seed rate card with base components per category and complexity tier."""

RATE_CARD_DATA = [
    # ── Web Development ──
    ("web", "Landing Page", "simple", 15000, "flat"),
    ("web", "Landing Page", "medium", 25000, "flat"),
    ("web", "Landing Page", "complex", 40000, "flat"),
    ("web", "Multi-Page Website", "simple", 30000, "flat"),
    ("web", "Multi-Page Website", "medium", 50000, "flat"),
    ("web", "Multi-Page Website", "complex", 80000, "flat"),
    ("web", "Additional Page", "simple", 3000, "per_page"),
    ("web", "Additional Page", "medium", 5000, "per_page"),
    ("web", "Additional Page", "complex", 8000, "per_page"),
    ("web", "E-commerce Module", "simple", 40000, "flat"),
    ("web", "E-commerce Module", "medium", 70000, "flat"),
    ("web", "E-commerce Module", "complex", 120000, "flat"),
    ("web", "CMS Integration", "simple", 15000, "flat"),
    ("web", "CMS Integration", "medium", 30000, "flat"),
    ("web", "CMS Integration", "complex", 50000, "flat"),
    ("web", "Authentication System", "simple", 10000, "flat"),
    ("web", "Authentication System", "medium", 20000, "flat"),
    ("web", "Authentication System", "complex", 35000, "flat"),
    ("web", "Admin Panel", "simple", 20000, "flat"),
    ("web", "Admin Panel", "medium", 40000, "flat"),
    ("web", "Admin Panel", "complex", 65000, "flat"),
    ("web", "Hosting Setup", "simple", 5000, "flat"),
    ("web", "Hosting Setup", "medium", 10000, "flat"),
    ("web", "Hosting Setup", "complex", 18000, "flat"),
    ("web", "Domain & SSL Config", "simple", 3000, "flat"),
    ("web", "Domain & SSL Config", "medium", 5000, "flat"),
    ("web", "Domain & SSL Config", "complex", 8000, "flat"),
    ("web", "Third-Party API Integration", "simple", 10000, "flat"),
    ("web", "Third-Party API Integration", "medium", 25000, "flat"),
    ("web", "Third-Party API Integration", "complex", 45000, "flat"),
    ("web", "Responsive Design", "simple", 8000, "flat"),
    ("web", "Responsive Design", "medium", 15000, "flat"),
    ("web", "Responsive Design", "complex", 25000, "flat"),
    # ── Mobile App Development ──
    ("mobile", "iOS App", "simple", 80000, "per_platform"),
    ("mobile", "iOS App", "medium", 150000, "per_platform"),
    ("mobile", "iOS App", "complex", 250000, "per_platform"),
    ("mobile", "Android App", "simple", 70000, "per_platform"),
    ("mobile", "Android App", "medium", 130000, "per_platform"),
    ("mobile", "Android App", "complex", 220000, "per_platform"),
    ("mobile", "Cross-Platform App", "simple", 100000, "flat"),
    ("mobile", "Cross-Platform App", "medium", 180000, "flat"),
    ("mobile", "Cross-Platform App", "complex", 300000, "flat"),
    ("mobile", "Backend API", "simple", 30000, "flat"),
    ("mobile", "Backend API", "medium", 60000, "flat"),
    ("mobile", "Backend API", "complex", 100000, "flat"),
    ("mobile", "Push Notifications", "simple", 8000, "flat"),
    ("mobile", "Push Notifications", "medium", 15000, "flat"),
    ("mobile", "Push Notifications", "complex", 25000, "flat"),
    ("mobile", "Payment Integration", "simple", 15000, "flat"),
    ("mobile", "Payment Integration", "medium", 30000, "flat"),
    ("mobile", "Payment Integration", "complex", 50000, "flat"),
    ("mobile", "Authentication System", "simple", 12000, "flat"),
    ("mobile", "Authentication System", "medium", 22000, "flat"),
    ("mobile", "Authentication System", "complex", 38000, "flat"),
    ("mobile", "Offline Mode", "simple", 15000, "flat"),
    ("mobile", "Offline Mode", "medium", 30000, "flat"),
    ("mobile", "Offline Mode", "complex", 50000, "flat"),
    ("mobile", "App Store Submission", "simple", 5000, "flat"),
    ("mobile", "App Store Submission", "medium", 8000, "flat"),
    ("mobile", "App Store Submission", "complex", 12000, "flat"),
    # ── Custom Software Development ──
    ("custom_software", "Simple CRUD Module", "simple", 20000, "flat"),
    ("custom_software", "Simple CRUD Module", "medium", 35000, "flat"),
    ("custom_software", "Simple CRUD Module", "complex", 55000, "flat"),
    ("custom_software", "Dashboard & Reporting", "simple", 25000, "flat"),
    ("custom_software", "Dashboard & Reporting", "medium", 45000, "flat"),
    ("custom_software", "Dashboard & Reporting", "complex", 75000, "flat"),
    ("custom_software", "Third-Party Integration", "simple", 15000, "flat"),
    ("custom_software", "Third-Party Integration", "medium", 35000, "flat"),
    ("custom_software", "Third-Party Integration", "complex", 60000, "flat"),
    ("custom_software", "AI/Automation Feature", "simple", 30000, "flat"),
    ("custom_software", "AI/Automation Feature", "medium", 60000, "flat"),
    ("custom_software", "AI/Automation Feature", "complex", 100000, "flat"),
    ("custom_software", "Authentication & RBAC", "simple", 15000, "flat"),
    ("custom_software", "Authentication & RBAC", "medium", 30000, "flat"),
    ("custom_software", "Authentication & RBAC", "complex", 50000, "flat"),
    ("custom_software", "Data Migration", "simple", 10000, "flat"),
    ("custom_software", "Data Migration", "medium", 25000, "flat"),
    ("custom_software", "Data Migration", "complex", 45000, "flat"),
    ("custom_software", "Workflow Automation", "simple", 20000, "flat"),
    ("custom_software", "Workflow Automation", "medium", 40000, "flat"),
    ("custom_software", "Workflow Automation", "complex", 70000, "flat"),
    ("custom_software", "Cloud Infrastructure Setup", "simple", 15000, "flat"),
    ("custom_software", "Cloud Infrastructure Setup", "medium", 30000, "flat"),
    ("custom_software", "Cloud Infrastructure Setup", "complex", 55000, "flat"),
]


def seed_rate_card(db) -> int:
    from app.models import RateCard

    existing = db.query(RateCard).count()
    if existing > 0:
        return existing

    for category, component, tier, price, unit in RATE_CARD_DATA:
        db.add(
            RateCard(
                category=category,
                component_name=component,
                complexity_tier=tier,
                base_price=price,
                unit=unit,
            )
        )
    db.commit()
    return len(RATE_CARD_DATA)
