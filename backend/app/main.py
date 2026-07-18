from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.database import Base, engine
from app.routes import admin, auth, client_auth, requests, marketplace
from app.seed_rate_card import seed_rate_card, seed_default_services
from app.database import SessionLocal


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        Base.metadata.create_all(bind=engine)
        db = SessionLocal()
        try:
            seed_rate_card(db)
            seed_default_services(db)
        finally:
            db.close()
    except Exception as e:
        print(f"\n[WARNING] Database connection failed at startup: {e}\n")
    yield


app = FastAPI(title="Softkart API", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(requests.router)
app.include_router(auth.router)
app.include_router(client_auth.router)
app.include_router(marketplace.router)
app.include_router(admin.router)




@app.get("/api/health")
def health():
    return {"status": "ok", "service": "softkart"}
