from fastapi import APIRouter, Depends, HTTPException, Request as FastAPIRequest
from sqlalchemy.orm import joinedload

from app.database import get_db
from app.models import Client, ProposalVersion, RateCard, Request
from app.schemas import (
    ConfirmRequest,
    FeedbackCreate,
    RateCardOut,
    RequestCreate,
    RequestOut,
)
from app.services.email_service import LOCKED_MESSAGE, MAX_VERSIONS, detect_meeting_request, send_confirmation_alert, send_human_review_alert, send_meeting_request_alert
from app.services.proposal_engine import generate_proposal
from app.services.propotrack import push_to_propotrack
from app.routes.client_auth import verify_client_session
from app.routes.auth import verify_session as verify_admin_session

router = APIRouter(prefix="/api", tags=["requests"])


def verify_owner_or_admin(req_obj: Request, fastapi_req: FastAPIRequest):
    # Try admin session first
    token = fastapi_req.cookies.get("softcomerce_session")
    if token:
        try:
            admin_data = verify_admin_session(fastapi_req)
            if admin_data.get("role") == "admin":
                return True
        except Exception:
            pass

    # Try client session
    token = fastapi_req.cookies.get("softcomerce_client_session")
    if token:
        try:
            client_data = verify_client_session(fastapi_req)
            if client_data.get("client_id") == req_obj.client_id:
                return True
        except Exception:
            pass

    raise HTTPException(status_code=401, detail="Not authorized to access this request")


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


@router.get("/rate-card", response_model=list[RateCardOut])
def get_rate_card(category: str | None = None, db=Depends(get_db)):
    q = db.query(RateCard)
    if category:
        q = q.filter(RateCard.category == category)
    return q.order_by(RateCard.category, RateCard.component_name, RateCard.complexity_tier).all()


@router.get("/requests", response_model=list[RequestOut])
def get_client_requests(
    session: dict = Depends(verify_client_session),
    db=Depends(get_db)
):
    client_id = session.get("client_id")
    reqs = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == client_id)
        .order_by(Request.created_at.desc())
        .all()
    )
    # wait, Request.client_id == client_id not Request.id == client_id
    reqs = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.client_id == client_id)
        .order_by(Request.created_at.desc())
        .all()
    )
    return [_request_to_out(r) for r in reqs]


@router.post("/requests", response_model=RequestOut)
async def create_request(
    body: RequestCreate,
    session: dict = Depends(verify_client_session),
    db=Depends(get_db)
):
    client_id = session.get("client_id")
    req = Request(
        client_id=client_id,
        category=body.category,
        requirements_raw=body.requirements_raw,
        requirements_structured=body.requirements_structured.model_dump(),
        status="pending",
    )
    db.add(req)
    db.flush()

    proposal_data = await generate_proposal(
        db,
        category=body.category,
        requirements_raw=body.requirements_raw,
        requirements_structured=body.requirements_structured.model_dump(),
    )

    version = ProposalVersion(
        request_id=req.id,
        version_number=1,
        scope_breakdown=proposal_data["scope_breakdown"],
        budget_min=proposal_data["budget_min"],
        budget_max=proposal_data["budget_max"],
        timeline_estimate=proposal_data["timeline_estimate"],
        assumptions=proposal_data["assumptions"],
        exclusions=proposal_data["exclusions"],
        client_feedback=None,
    )
    db.add(version)
    db.commit()

    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == req.id)
        .first()
    )
    return _request_to_out(req)


@router.get("/requests/{request_id}", response_model=RequestOut)
def get_request(request_id: int, fastapi_req: FastAPIRequest, db=Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    verify_owner_or_admin(req, fastapi_req)
    return _request_to_out(req)


@router.post("/requests/{request_id}/feedback", response_model=RequestOut)
async def submit_feedback(request_id: int, body: FeedbackCreate, fastapi_req: FastAPIRequest, db=Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    verify_owner_or_admin(req, fastapi_req)
    
    if req.status != "pending":
        raise HTTPException(status_code=400, detail=f"Request is {req.status}, cannot submit feedback")

    version_count = len(req.proposal_versions)
    if version_count >= MAX_VERSIONS:
        req.status = "needs_human_review"
        db.commit()
        req = (
            db.query(Request)
            .options(joinedload(Request.client), joinedload(Request.proposal_versions))
            .filter(Request.id == request_id)
            .first()
        )
        await send_human_review_alert(db, req)
        return _request_to_out(req)

    previous = req.proposal_versions[-1]
    feedback_full = f"[{body.feedback_reason}] {body.feedback_text}"

    # ── Meeting detection: if client asks for live call/meeting, skip AI and alert founder ──
    if detect_meeting_request(body.feedback_text):
        req.status = "needs_human_review"
        db.commit()
        req = (
            db.query(Request)
            .options(joinedload(Request.client), joinedload(Request.proposal_versions))
            .filter(Request.id == request_id)
            .first()
        )
        await send_meeting_request_alert(db, req, feedback_text=body.feedback_text)
        return _request_to_out(req)

    proposal_data = await generate_proposal(
        db,
        category=req.category,
        requirements_raw=req.requirements_raw,
        requirements_structured=req.requirements_structured or {},
        previous_version=previous,
        client_feedback=feedback_full,
    )

    new_version = ProposalVersion(
        request_id=req.id,
        version_number=version_count + 1,
        scope_breakdown=proposal_data["scope_breakdown"],
        budget_min=proposal_data["budget_min"],
        budget_max=proposal_data["budget_max"],
        timeline_estimate=proposal_data["timeline_estimate"],
        assumptions=proposal_data["assumptions"],
        exclusions=proposal_data["exclusions"],
        client_feedback=feedback_full,
    )
    db.add(new_version)
    db.commit()

    # If this was the 4th version, lock and alert admin
    if new_version.version_number >= MAX_VERSIONS:
        req.status = "needs_human_review"
        db.commit()
        req = (
            db.query(Request)
            .options(joinedload(Request.client), joinedload(Request.proposal_versions))
            .filter(Request.id == request_id)
            .first()
        )
        await send_human_review_alert(db, req)

    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    return _request_to_out(req)


@router.post("/requests/{request_id}/confirm", response_model=RequestOut)
async def confirm_request(request_id: int, body: ConfirmRequest, fastapi_req: FastAPIRequest, db=Depends(get_db)):
    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )
    if not req:
        raise HTTPException(status_code=404, detail="Request not found")
    
    verify_owner_or_admin(req, fastapi_req)
    
    if req.status == "confirmed":
        raise HTTPException(status_code=400, detail="Already confirmed")
    if req.status == "needs_human_review":
        raise HTTPException(
            status_code=400,
            detail="This request requires founder review. Please wait for personal follow-up.",
        )
    if not req.proposal_versions:
        raise HTTPException(status_code=400, detail="No proposal to confirm")

    req.status = "confirmed"
    db.commit()

    req = (
        db.query(Request)
        .options(joinedload(Request.client), joinedload(Request.proposal_versions))
        .filter(Request.id == request_id)
        .first()
    )

    await send_confirmation_alert(db, req)
    latest = req.proposal_versions[-1]
    await push_to_propotrack(req, latest)

    return _request_to_out(req)
