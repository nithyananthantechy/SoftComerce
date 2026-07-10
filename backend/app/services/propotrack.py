import logging

import httpx

from app.config import settings

logger = logging.getLogger(__name__)


async def push_to_propotrack(request, latest_version) -> str:
    if not settings.propotrack_webhook_url:
        logger.info("PropoTrack webhook not configured — skipping")
        return "skipped_no_config"

    client = request.client
    payload = {
        "source": "Softcomerce",
        "client_name": client.name,
        "client_email": client.email,
        "client_phone": client.phone,
        "client_company": client.company,
        "category": request.category,
        "scope_breakdown": latest_version.scope_breakdown,
        "budget_min": float(latest_version.budget_min) if latest_version.budget_min else None,
        "budget_max": float(latest_version.budget_max) if latest_version.budget_max else None,
        "timeline_estimate": latest_version.timeline_estimate,
        "assumptions": latest_version.assumptions,
        "exclusions": latest_version.exclusions,
        "softcomerce_request_id": request.id,
    }

    headers = {"Content-Type": "application/json"}
    if settings.propotrack_webhook_secret:
        headers["X-Webhook-Secret"] = settings.propotrack_webhook_secret

    try:
        async with httpx.AsyncClient(timeout=30) as http:
            resp = await http.post(settings.propotrack_webhook_url, json=payload, headers=headers)
            resp.raise_for_status()
        return "sent"
    except Exception as e:
        logger.error("PropoTrack webhook failed: %s", e)
        return f"failed: {e}"
