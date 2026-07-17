from datetime import datetime, timedelta
import random
from fastapi import APIRouter, Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Client
from app.schemas import (
    ClientCreate,
    ClientLogin,
    ClientOut,
    ForgotPasswordRequest,
    ResetPasswordVerify,
    ProfileUpdate,
    PasswordChange,
    EmailChangeRequest,
    EmailChangeVerify,
    VerifyPasswordChange,
    RegisterVerify,
)
from app.services.email_service import send_otp_email

router = APIRouter(prefix="/api/auth/client", tags=["client_auth"])
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
serializer = URLSafeTimedSerializer(settings.session_secret)
CLIENT_SESSION_MAX_AGE = 60 * 60 * 24 * 30  # 30 days


def create_client_session_token(client_id: int) -> str:
    return serializer.dumps({"role": "client", "client_id": client_id})


def verify_client_session(request: Request) -> dict:
    token = request.cookies.get("softcomerce_client_session")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated as client")
    try:
        data = serializer.loads(token, max_age=CLIENT_SESSION_MAX_AGE)
        if data.get("role") != "client" or "client_id" not in data:
            raise HTTPException(status_code=401, detail="Invalid client session")
    except BadSignature:
        raise HTTPException(status_code=401, detail="Invalid session signature")
    return data


@router.post("/register", response_model=ClientOut)
async def register(body: ClientCreate, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(Client).filter(Client.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not body.password:
        raise HTTPException(status_code=400, detail="Password is required for registration")

    password_hash = pwd_context.hash(body.password)

    email_otp = f"{random.randint(100000, 999999)}"

    client = Client(
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        password_hash=password_hash,
        is_email_verified=False,
        is_phone_verified=True,  # Phone verification not required
        register_email_otp=email_otp,
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    print(f"\n[DEVELOPER WARNING] REGISTER EMAIL OTP FOR {client.email}: {email_otp}\n")

    try:
        await send_otp_email(client.email, email_otp, "verify your registration email for Softkart")
    except Exception as e:
        print(f"\n[WARNING] Failed to send registration email: {e}. Proceeding in offline dev mode.\n")

    return client


@router.post("/register/verify", response_model=ClientOut)
def verify_register(
    body: RegisterVerify,
    response: Response,
    db: Session = Depends(get_db)
):
    client = db.query(Client).filter(Client.email == body.email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if client.is_email_verified:
        # Already verified, let's log them in
        token = create_client_session_token(client.id)
        response.set_cookie(
            key="softcomerce_client_session",
            value=token,
            httponly=True,
            secure=False,
            samesite="lax",
            path="/",
        )
        return client

    if client.register_email_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    client.is_email_verified = True
    client.register_email_otp = None
    db.commit()
    db.refresh(client)

    token = create_client_session_token(client.id)
    response.set_cookie(
        key="softcomerce_client_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return client


@router.post("/login")
def login(body: ClientLogin, response: Response, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == body.email).first()
    if not client or not client.password_hash:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    if not pwd_context.verify(body.password, client.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_client_session_token(client.id)
    response.set_cookie(
        key="softcomerce_client_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        path="/",
    )
    return {"ok": True, "client_id": client.id}


@router.post("/logout")
def logout(response: Response):
    response.delete_cookie("softcomerce_client_session")
    return {"ok": True}


@router.get("/me", response_model=ClientOut)
def me(session: dict = Depends(verify_client_session), db: Session = Depends(get_db)):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    return client


@router.post("/become-seller", response_model=ClientOut)
def become_seller(session: dict = Depends(verify_client_session), db: Session = Depends(get_db)):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")
    
    client.is_seller = True
    db.commit()
    db.refresh(client)
    return client


@router.post("/forgot-password")
async def forgot_password(body: ForgotPasswordRequest, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == body.email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Email address not found")

    otp = f"{random.randint(100000, 999999)}"
    client.reset_otp = otp
    client.reset_otp_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    print(f"\n[DEVELOPER WARNING] PASSWORD RESET OTP FOR {body.email}: {otp}\n")

    try:
        await send_otp_email(body.email, otp, "reset your Softkart password")
    except Exception as e:
        print(f"\n[WARNING] Failed to send email: {e}. Proceeding in offline dev mode.\n")

    return {"ok": True, "message": "Verification code sent to your email."}


@router.post("/reset-password")
def reset_password(body: ResetPasswordVerify, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.email == body.email).first()
    if not client:
        raise HTTPException(status_code=404, detail="Email address not found")

    if not client.reset_otp or client.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not client.reset_otp_expires or client.reset_otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")

    # Hash new password
    client.password_hash = pwd_context.hash(body.new_password)
    client.reset_otp = None
    client.reset_otp_expires = None
    db.commit()

    return {"ok": True, "message": "Password reset successfully."}


@router.put("/profile/update", response_model=ClientOut)
def update_profile(
    body: ProfileUpdate,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    client.name = body.name
    client.company = body.company
    client.phone = body.phone
    db.commit()
    db.refresh(client)
    return client


@router.post("/profile/request-password-change")
async def request_password_change(
    body: PasswordChange,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client or not client.password_hash:
        raise HTTPException(status_code=404, detail="Client not found")

    if not pwd_context.verify(body.current_password, client.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    otp = f"{random.randint(100000, 999999)}"
    client.reset_otp = otp
    client.reset_otp_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    print(f"\n[DEVELOPER WARNING] PASSWORD CHANGE OTP FOR {client.email}: {otp}\n")

    try:
        await send_otp_email(client.email, otp, "verify your password change for Softkart")
    except Exception as e:
        print(f"\n[WARNING] Failed to send email: {e}. Proceeding in offline dev mode.\n")

    return {"ok": True, "message": "Verification OTP sent to your registered email address."}


@router.post("/profile/verify-password-change")
def verify_password_change(
    body: VerifyPasswordChange,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client or not client.password_hash:
        raise HTTPException(status_code=404, detail="Client not found")

    if not client.reset_otp or client.reset_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not client.reset_otp_expires or client.reset_otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")

    if not pwd_context.verify(body.current_password, client.password_hash):
        raise HTTPException(status_code=400, detail="Incorrect current password")

    client.password_hash = pwd_context.hash(body.new_password)
    client.reset_otp = None
    client.reset_otp_expires = None
    db.commit()

    return {"ok": True, "message": "Password changed successfully."}


@router.post("/profile/request-email-change")
async def request_email_change(
    body: EmailChangeRequest,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    # Verify new email is not already in use
    existing = db.query(Client).filter(Client.email == body.new_email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered by another user")

    otp = f"{random.randint(100000, 999999)}"
    client.email_change_temp = body.new_email
    client.email_change_otp = otp
    client.email_change_otp_expires = datetime.utcnow() + timedelta(minutes=15)
    db.commit()
    print(f"\n[DEVELOPER WARNING] EMAIL CHANGE OTP FOR {client.email} -> {body.new_email}: {otp}\n")

    try:
        await send_otp_email(body.new_email, otp, "verify your new email address for Softkart")
    except Exception as e:
        print(f"\n[WARNING] Failed to send email: {e}. Proceeding in offline dev mode.\n")

    return {"ok": True, "message": "Verification code sent to the new email address."}


@router.post("/profile/verify-email-change", response_model=ClientOut)
def verify_email_change(
    body: EmailChangeVerify,
    session: dict = Depends(verify_client_session),
    db: Session = Depends(get_db)
):
    client_id = session.get("client_id")
    client = db.query(Client).filter(Client.id == client_id).first()
    if not client:
        raise HTTPException(status_code=404, detail="Client not found")

    if not client.email_change_otp or client.email_change_otp != body.otp:
        raise HTTPException(status_code=400, detail="Invalid verification code")

    if not client.email_change_otp_expires or client.email_change_otp_expires < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Verification code has expired")

    # Verify email is still available
    existing = db.query(Client).filter(Client.email == client.email_change_temp).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email has been registered in the meantime")

    client.email = client.email_change_temp
    client.email_change_temp = None
    client.email_change_otp = None
    client.email_change_otp_expires = None
    db.commit()
    db.refresh(client)
    return client

