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
    DemoRequest,
)
from app.services.email_service import LOCKED_MESSAGE, MAX_VERSIONS, detect_meeting_request, send_confirmation_alert, send_human_review_alert, send_meeting_request_alert, send_email, _email_wrapper
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


@router.post("/demo-request")
async def demo_request(body: DemoRequest, db=Depends(get_db)):
    subject = f"📅 Live Demo Requested: {body.product_name}"
    
    body_html = f"""
    <h2 style="margin:0 0 20px;font-size:20px;font-weight:700;color:#0f172a;">
      New Live Demo/Meeting Request!
    </h2>
    <table width="100%" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:24px;">
      <tr>
        <td style="background-color:#f8fafc;border-radius:10px;padding:20px;border:1px solid #e2e8f0;">
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td width="40%" style="padding:5px 0;color:#475569;font-size:14px;"><strong>Product</strong></td>
              <td width="60%" style="padding:5px 0;color:#0f172a;font-size:14px;font-weight:bold;">{body.product_name}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#475569;font-size:14px;"><strong>Name</strong></td>
              <td style="padding:5px 0;color:#475569;font-size:14px;">{body.name}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#475569;font-size:14px;"><strong>Email</strong></td>
              <td style="padding:5px 0;font-size:14px;"><a href="mailto:{body.email}" style="color:#3b82f6;text-decoration:none;">{body.email}</a></td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#475569;font-size:14px;"><strong>Contact Phone</strong></td>
              <td style="padding:5px 0;color:#475569;font-size:14px;">{body.contact}</td>
            </tr>
            <tr>
              <td style="padding:5px 0;color:#475569;font-size:14px;"><strong>Scheduled Time</strong></td>
              <td style="padding:5px 0;color:#ef4444;font-size:14px;font-weight:bold;">{body.meeting_time}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <p style="margin:0;color:#475569;font-size:14px;line-height:1.6;">
      Please reach out to the client to confirm the scheduled demo/meeting.
    </p>
    """
    
    html_body = _email_wrapper(
        header_color="#3b82f6",
        header_emoji="📅",
        header_title="Demo Request",
        body_html=body_html
    )
    
    await send_email(subject, html_body)
    return {"ok": True}
