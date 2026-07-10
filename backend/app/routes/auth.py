from fastapi import APIRouter, Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from passlib.context import CryptContext
from sqlalchemy.orm import joinedload

from app.config import settings
from app.database import get_db
from app.schemas import AdminLogin
from app.services.email_service import MAX_VERSIONS

router = APIRouter(prefix="/api/auth", tags=["auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
serializer = URLSafeTimedSerializer(settings.session_secret)
SESSION_MAX_AGE = 60 * 60 * 24 * 7  # 7 days


def create_session_token() -> str:
    return serializer.dumps({"role": "admin", "user": settings.admin_username})


def verify_session(request: Request) -> dict:
    token = request.cookies.get("softcomerce_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        data = serializer.loads(token, max_age=SESSION_MAX_AGE)
    except BadSignature:
        raise HTTPException(status_code=401, detail="Invalid session")
    return data


@router.post("/login")
def login(body: AdminLogin, response: Response):
    if body.username != settings.admin_username or body.password != settings.admin_password:
        raise HTTPException(status_code=401, detail="Invalid credentials")

    token = create_session_token()
    response.set_cookie(
        key="softcomerce_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=SESSION_MAX_AGE,
        path="/",
    )
    return {"ok": True}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("softcomerce_session")
    return {"ok": True}


@router.get("/me")
def me(session: dict = Depends(verify_session)):
    return {"username": session.get("user"), "role": session.get("role")}
