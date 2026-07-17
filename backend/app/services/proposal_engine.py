import json
import logging
import re

from app.config import settings
from app.models import ProposalVersion, RateCard

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """You are Softkart's proposal engine for NITECHSPARK. Given a client's structured
requirements and the rate card below, generate a proposal.

Rules:
1. Map each requirement to one or more rate card components. Do not invent prices
   outside the rate card.
2. Assign a complexity tier per component based on the requirement details.
3. Sum to a budget RANGE (min-max), never a single fixed price. Min should reflect
   simple-tier pricing; max should reflect complex-tier or upper-bound estimates.
4. Write a clear scope breakdown (bullet list of what's included).
5. Write explicit assumptions (e.g., "assumes client provides content/branding assets").
6. Write explicit exclusions (e.g., "third-party licensing costs not included").
7. Estimate a realistic timeline range (e.g., "4-6 weeks").
8. If this is a revision (client_feedback provided), adjust scope/budget/timeline
   specifically addressing that feedback, and note what changed from the previous version.
9. All prices are in Indian Rupees (INR).
10. If the client's 'budget_expectation' is significantly lower than your calculated rate card total, you MUST mention this discrepancy explicitly in the "assumptions" or "exclusions". Explain why their requested features require a higher budget (e.g. "Note: Your requested budget was ₹15,000, but building a custom e-commerce platform requires a minimum of ₹2.5L. We can discuss removing AI features to lower the cost."). Do NOT lower prices below the rate card.
11. Output ONLY valid JSON matching this schema:
   {
     "scope_breakdown": ["item1", "item2"],
     "budget_min": number,
     "budget_max": number,
     "timeline_estimate": "string",
     "assumptions": "string",
     "exclusions": "string"
   }"""


def _rate_card_to_json(rate_cards: list[RateCard]) -> list[dict]:
    return [
        {
            "category": rc.category,
            "component_name": rc.component_name,
            "complexity_tier": rc.complexity_tier,
            "base_price": float(rc.base_price),
            "unit": rc.unit,
        }
        for rc in rate_cards
    ]


def _extract_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = re.sub(r"^```(?:json)?\n?", "", text)
        text = re.sub(r"\n?```$", "", text)
    # Try to find JSON block even if surrounded by text
    match = re.search(r"\{.*\}", text, re.DOTALL)
    if match:
        return json.loads(match.group())
    return json.loads(text)


def _fallback_proposal(
    rate_cards: list[RateCard],
    category: str,
    requirements: dict,
) -> dict:
    """Deterministic fallback when AI is unavailable — maps basic flags to rate card."""
    selected: list[tuple[str, str, float]] = []
    structured = requirements.get("requirements_structured") or requirements

    if category == "web":
        web = structured.get("web") or {}
        pages = web.get("number_of_pages") or 5
        tier = "medium" if pages > 10 else "simple"
        base = _find_price(rate_cards, "Multi-Page Website", tier)
        selected.append(("Multi-Page Website", tier, base))
        if pages > 5:
            extra = _find_price(rate_cards, "Additional Page", tier)
            selected.append(("Additional Page", tier, extra * (pages - 5)))
        if web.get("ecommerce_needed"):
            selected.append(("E-commerce Module", "medium", _find_price(rate_cards, "E-commerce Module", "medium")))
        if web.get("cms_needed"):
            selected.append(("CMS Integration", "simple", _find_price(rate_cards, "CMS Integration", "simple")))
        if web.get("hosting_needed"):
            selected.append(("Hosting Setup", "simple", _find_price(rate_cards, "Hosting Setup", "simple")))
        if web.get("domain_ssl_needed"):
            selected.append(("Domain & SSL Config", "simple", _find_price(rate_cards, "Domain & SSL Config", "simple")))
    elif category == "mobile":
        mobile = structured.get("mobile") or {}
        platforms = mobile.get("platforms") or ["both"]
        if "both" in platforms:
            selected.append(("Cross-Platform App", "medium", _find_price(rate_cards, "Cross-Platform App", "medium")))
        else:
            for p in platforms:
                comp = "iOS App" if p == "ios" else "Android App"
                selected.append((comp, "medium", _find_price(rate_cards, comp, "medium")))
        if mobile.get("backend_needed"):
            selected.append(("Backend API", "medium", _find_price(rate_cards, "Backend API", "medium")))
        if mobile.get("push_notifications"):
            selected.append(("Push Notifications", "simple", _find_price(rate_cards, "Push Notifications", "simple")))
        if mobile.get("payment_integration"):
            selected.append(("Payment Integration", "medium", _find_price(rate_cards, "Payment Integration", "medium")))
    else:
        cs = structured.get("custom_software") or {}
        selected.append(("Simple CRUD Module", "medium", _find_price(rate_cards, "Simple CRUD Module", "medium")))
        selected.append(("Dashboard & Reporting", "simple", _find_price(rate_cards, "Dashboard & Reporting", "simple")))
        for _ in cs.get("integrations") or []:
            selected.append(("Third-Party Integration", "medium", _find_price(rate_cards, "Third-Party Integration", "medium")))
        if cs.get("automation_ai_features"):
            selected.append(("AI/Automation Feature", "medium", _find_price(rate_cards, "AI/Automation Feature", "medium")))

    total = sum(s[2] for s in selected)
    scope = [f"{name} ({tier} tier)" for name, tier, _ in selected]

    budget_min = round(total * 0.85)
    budget_max = round(total * 1.25)

    client_budget_raw = structured.get("budget_expectation")
    try:
        client_budget = float(str(client_budget_raw).replace(",", "")) if client_budget_raw else None
    except (ValueError, TypeError):
        client_budget = None

    base_assumptions = "Assumes client provides content, branding assets, and timely feedback. One round of revisions included per deliverable."
    if client_budget and client_budget < budget_min:
        base_assumptions = (
            f"Note: Your requested budget was \u20b9{int(client_budget):,}, but the minimum cost "
            f"to build this scope using our rate card is \u20b9{budget_min:,}. "
            "We recommend discussing which features to trim to fit your budget. "
            + base_assumptions
        )

    return {
        "scope_breakdown": scope or ["Initial scoping and discovery"],
        "budget_min": budget_min,
        "budget_max": budget_max,
        "timeline_estimate": "4-8 weeks",
        "assumptions": base_assumptions,
        "exclusions": "Third-party licensing, paid API subscriptions, ongoing maintenance, and content creation are not included.",
    }


def _find_price(rate_cards: list[RateCard], component: str, tier: str) -> float:
    for rc in rate_cards:
        if rc.component_name == component and rc.complexity_tier == tier:
            return float(rc.base_price)
    return 0.0


def _clamp_budget(result: dict, rate_cards: list[RateCard]) -> dict:
    """Clamp AI-generated budget against rate card bounds."""
    max_possible = sum(float(rc.base_price) for rc in rate_cards) * 2
    result["budget_min"] = max(0, min(float(result["budget_min"]), max_possible))
    result["budget_max"] = max(result["budget_min"], min(float(result["budget_max"]), max_possible))
    return result


async def _call_groq(user_content: str) -> str:
    """Call Groq API (Llama 3) for proposal generation."""
    from groq import AsyncGroq
    client = AsyncGroq(
        api_key=settings.groq_api_key,
        max_retries=0,
        timeout=15.0,
    )
    response = await client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": SYSTEM_PROMPT},
            {"role": "user", "content": user_content},
        ],
        max_tokens=2048,
        temperature=0.3,
    )
    return response.choices[0].message.content


async def _call_gemini(user_content: str) -> str:
    """Call Google Gemini API as fallback."""
    import google.generativeai as genai
    genai.configure(api_key=settings.gemini_api_key)
    model = genai.GenerativeModel(
        model_name="gemini-1.5-flash",
        system_instruction=SYSTEM_PROMPT,
    )
    response = await model.generate_content_async(user_content)
    return response.text


async def generate_proposal(
    db,
    category: str,
    requirements_raw: str,
    requirements_structured: dict,
    previous_version: ProposalVersion | None = None,
    client_feedback: str | None = None,
) -> dict:
    rate_cards = (
        db.query(RateCard).filter(RateCard.category == category).order_by(RateCard.component_name).all()
    )
    rate_card_json = _rate_card_to_json(rate_cards)

    requirements_payload = {
        "category": category,
        "requirements_raw": requirements_raw,
        "requirements_structured": requirements_structured,
    }

    # Explicitly surface the client's budget expectation so the AI respects it
    budget_note = ""
    client_budget = requirements_structured.get("budget_expectation")
    if client_budget:
        budget_note = f"\n\nIMPORTANT: The client's stated budget is ₹{client_budget}. You MUST try to propose a scope that fits within or close to this budget. If it is truly impossible to deliver any useful scope within this amount, clearly explain in assumptions why a minimum viable version still costs more, and propose the absolute cheapest possible scope."

    user_content = f"Rate card: {json.dumps(rate_card_json)}\n\nClient requirements: {json.dumps(requirements_payload)}{budget_note}"

    if previous_version:
        prev = {
            "scope_breakdown": previous_version.scope_breakdown,
            "budget_min": float(previous_version.budget_min) if previous_version.budget_min else 0,
            "budget_max": float(previous_version.budget_max) if previous_version.budget_max else 0,
            "timeline_estimate": previous_version.timeline_estimate,
            "assumptions": previous_version.assumptions,
            "exclusions": previous_version.exclusions,
        }
        user_content += f"\n\nPrevious version: {json.dumps(prev)}"
        user_content += f"\n\nClient feedback: {client_feedback}"

    # No AI configured — use deterministic fallback
    if not settings.has_ai:
        logger.warning("No AI API key configured — using deterministic fallback")
        return _fallback_proposal(rate_cards, category, requirements_payload)

    raw: str | None = None

    # 1. Try Groq (primary)
    if settings.groq_api_key:
        try:
            raw = await _call_groq(user_content)
            logger.info("Proposal generated via Groq")
        except Exception as e:
            logger.warning("Groq call failed: %s — trying Gemini fallback", e)
            raw = None

    # 2. Try Gemini (fallback)
    if raw is None and settings.gemini_api_key:
        try:
            raw = await _call_gemini(user_content)
            logger.info("Proposal generated via Gemini (fallback)")
        except Exception as e:
            logger.warning("Gemini call failed: %s — using deterministic fallback", e)
            raw = None

    # 3. Deterministic fallback
    if raw is None:
        logger.warning("All AI providers failed — using deterministic fallback")
        return _fallback_proposal(rate_cards, category, requirements_payload)

    try:
        result = _extract_json(raw)
        return _clamp_budget(result, rate_cards)
    except Exception as e:
        logger.error("Failed to parse AI JSON output: %s\nRaw: %s", e, raw[:500])
        return _fallback_proposal(rate_cards, category, requirements_payload)
