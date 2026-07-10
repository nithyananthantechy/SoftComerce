from fastapi import APIRouter, Depends, HTTPException, Request, Response
from itsdangerous import BadSignature, URLSafeTimedSerializer
from passlib.context import CryptContext
from sqlalchemy.orm import Session

from app.config import settings
from app.database import get_db
from app.models import Client
from app.schemas import ClientCreate, ClientLogin, ClientOut

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
def register(body: ClientCreate, response: Response, db: Session = Depends(get_db)):
    # Check if email exists
    existing = db.query(Client).filter(Client.email == body.email).first()
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")

    if not body.password:
        raise HTTPException(status_code=400, detail="Password is required for registration")

    password_hash = pwd_context.hash(body.password)

    client = Client(
        name=body.name,
        email=body.email,
        phone=body.phone,
        company=body.company,
        password_hash=password_hash,
    )
    db.add(client)
    db.commit()
    db.refresh(client)

    token = create_client_session_token(client.id)
    response.set_cookie(
        key="softcomerce_client_session",
        value=token,
        httponly=True,
        secure=False,
        samesite="lax",
        max_age=CLIENT_SESSION_MAX_AGE,
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
        max_age=CLIENT_SESSION_MAX_AGE,
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
