# Softcomerce

AI-powered instant proposal and budgeting tool for **NITECHSPARK**. Clients submit structured requirements, receive an AI-generated scope + budget proposal instantly, and can confirm or request up to 3 revisions before human handoff.

## Stack

| Layer    | Technology              |
|----------|-------------------------|
| Frontend | Next.js 15 + Tailwind   |
| Backend  | Python FastAPI          |
| Database | PostgreSQL (Neon, etc.) |
| AI       | Claude API              |
| Email    | SendGrid or SMTP        |

## Project Structure

```
SoftComerce/
├── backend/          FastAPI API, rate card engine, email alerts
│   ├── app/
│   │   ├── routes/   Public + admin + auth endpoints
│   │   └── services/ Proposal engine, email, PDF, PropoTrack
│   └── schema.sql
└── frontend/         Next.js client + admin dashboard
    ├── app/
    └── components/
```

## Quick Start

### 1. Database

Create a PostgreSQL database and run `backend/schema.sql` (optional — tables auto-create on startup).

### 2. Backend

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
pip install -r requirements.txt
copy .env.example .env         # fill in DATABASE_URL, ANTHROPIC_API_KEY, etc.
uvicorn app.main:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
npm install
copy .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment Variables

### Backend (`backend/.env`)

| Variable | Description |
|----------|-------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `ANTHROPIC_API_KEY` | Claude API key (falls back to rule-based engine if empty) |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Single admin login |
| `ADMIN_EMAIL` | Alert recipient (default: nithyananthan@nskgroups.website) |
| `SMTP_*` or `SENDGRID_API_KEY` | Email delivery |
| `PROPOTRACK_WEBHOOK_URL` | Optional PropoTrack ingestion endpoint |
| `FRONTEND_URL` | Used in alert email links |

### Frontend (`frontend/.env.local`)

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_API_URL` | Backend URL (default: http://localhost:8000) |

## Core Flow

1. Client selects category → fills structured form
2. AI maps requirements to **rate card** components → generates budget range + scope
3. Client sees proposal instantly → **Confirm** or **Request Changes** (max 4 versions)
4. On confirm → admin email + PropoTrack webhook
5. After 4th version without confirm → locked + "needs human review" email

## Admin Dashboard

Visit `/admin/login` with credentials from `ADMIN_USERNAME` / `ADMIN_PASSWORD`.

Features: request list with filters, version comparison, manual "needs review" override, PDF export for confirmed proposals.

## PropoTrack Integration

Set `PROPOTRACK_WEBHOOK_URL` to POST confirmed proposals as JSON:

```json
{
  "source": "Softcomerce",
  "client_name": "...",
  "client_email": "...",
  "category": "web",
  "scope_breakdown": ["..."],
  "budget_min": 45000,
  "budget_max": 60000,
  "timeline_estimate": "4-6 weeks",
  "softcomerce_request_id": 1
}
```

## Deployment

- **Frontend**: Vercel — set `NEXT_PUBLIC_API_URL` to your Render backend URL
- **Backend**: Render — set all env vars, start command: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
- **Database**: Neon PostgreSQL — paste connection string into `DATABASE_URL`

## Rate Card

The rate card is seeded automatically on first startup with 90+ components across web, mobile, and custom software categories. The AI **never invents prices** outside this table. View via `GET /api/rate-card?category=web`.
