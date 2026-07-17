# 🚀 SoftComerce — Live Launch Deployment Guide
**Target Launch: July 19, 2026 | Frontend → Vercel | Backend → Render**

---

## ✅ Pre-Flight Checklist

Before you start, make sure you have:
- [ ] GitHub account with this repository pushed
- [ ] [Vercel](https://vercel.com) account (free)
- [ ] [Render](https://render.com) account (free)
- [ ] Neon PostgreSQL database (already set up — URL in `.env`)
- [ ] An AI API key (Groq free tier works: https://console.groq.com)
- [ ] Email: SendGrid key OR Gmail SMTP credentials

---

## STEP 1 — Push Code to GitHub (5 mins)

Open PowerShell in `c:\Users\Nithyananthan\Desktop\SoftComerce`:

```powershell
git add .
git commit -m "feat: production deployment — Render + Vercel ready"
git push origin main
```

If you do not have a remote yet, create a new repo on GitHub and then:
```powershell
git remote add origin https://github.com/YOUR-USERNAME/softcomerce.git
git push -u origin main
```

---

## STEP 2 — Deploy Backend to Render (15 mins)

### 2a. Create a Web Service on Render

1. Go to → **https://dashboard.render.com/new/web**
2. Click **"Connect a repository"** → select your GitHub repo
3. Configure:

| Field | Value |
|---|---|
| **Name** | `softcomerce-backend` |
| **Region** | `Singapore (Southeast Asia)` |
| **Branch** | `main` |
| **Root Directory** | `backend` |
| **Runtime** | `Python 3` |
| **Build Command** | `pip install -r requirements.txt` |
| **Start Command** | `uvicorn app.main:app --host 0.0.0.0 --port $PORT` |
| **Plan** | `Free` |

### 2b. Set Environment Variables on Render

In Render → **Environment** tab, add these one-by-one:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Your full Neon connection string |
| `ANTHROPIC_API_KEY` | Your Claude API key (or leave blank if using Groq) |
| `GROQ_API_KEY` | Your Groq API key (free at console.groq.com) |
| `ADMIN_USERNAME` | `admin` |
| `ADMIN_PASSWORD` | `Nitechspark@2026` |
| `SESSION_SECRET` | Any 32+ char random string e.g. `NITS2026-SC-xK9mPqLzTw4rVbNdJ8yR3aEsWq` |
| `ADMIN_EMAIL` | `nithyananthan@nskgroups.website` |
| `FROM_EMAIL` | `noreply@nskgroups.website` |
| `SMTP_HOST` | `smtp.gmail.com` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | Your Gmail address |
| `SMTP_PASSWORD` | Your Gmail App Password (NOT your normal password) |
| `PROPOTRACK_WEBHOOK_URL` | `https://nitechspark-tracker-api.onrender.com/api/integrations/proposals` |
| `PROPOTRACK_WEBHOOK_SECRET` | `NITS-SC-2026-xK9mPqLzTw4rVbNdJ8` |
| `FRONTEND_URL` | *(fill in AFTER step 3 with your Vercel URL)* |
| `CORS_ORIGINS` | *(fill in AFTER step 3 with your Vercel URL)* |

### 2c. Deploy Backend

Click **"Create Web Service"** → wait ~3 minutes for build.

Once done, your URL will be: `https://softcomerce-backend.onrender.com`

**Test it:** Open `https://softcomerce-backend.onrender.com/api/health`
You should see: `{"status": "ok", "service": "softkart"}`

---

## STEP 3 — Deploy Frontend to Vercel (10 mins)

### 3a. Create a Project on Vercel

1. Go to → **https://vercel.com/new**
2. Click **"Import Git Repository"** → select your GitHub repo
3. Configure:

| Field | Value |
|---|---|
| **Project Name** | `softcomerce` |
| **Framework Preset** | `Next.js` (auto-detected) |
| **Root Directory** | `frontend` |
| **Build Command** | `npm run build` (default) |
| **Output Directory** | `.next` (default) |

### 3b. Set Environment Variables on Vercel

In **Environment Variables** section (before clicking Deploy):

| Variable | Value |
|---|---|
| `NEXT_PUBLIC_API_URL` | `https://softcomerce-backend.onrender.com` |

### 3c. Deploy Frontend

Click **"Deploy"** → wait ~2 minutes.

Your live URL: `https://softcomerce.vercel.app`

---

## STEP 4 — Wire Backend CORS to Frontend URL (5 mins)

Now that you have both URLs, go back to **Render Dashboard**:

1. Open your `softcomerce-backend` service
2. Go to **Environment** tab
3. Update these two variables:

| Variable | Value |
|---|---|
| `FRONTEND_URL` | `https://softcomerce.vercel.app` |
| `CORS_ORIGINS` | `https://softcomerce.vercel.app` |

4. Click **"Save Changes"** → Render will auto-redeploy (~2 mins)

---

## STEP 5 — Verify Everything (10 mins)

Test each of these URLs after deployment:

**Backend health check:**
`https://softcomerce-backend.onrender.com/api/health`
Expected: `{"status": "ok", "service": "softkart"}`

**API documentation (Swagger UI):**
`https://softcomerce-backend.onrender.com/docs`

**Frontend live site:**
`https://softcomerce.vercel.app`

**Admin dashboard:**
`https://softcomerce.vercel.app/admin/login`
Username: `admin` | Password: `Nitechspark@2026`

---

## STEP 6 — Render Cold-Start Fix (Recommended)

Free Render services spin down after 15 min of inactivity — first request takes ~30 sec to wake up.

**Fix using UptimeRobot (free):**
1. Create account at https://uptimerobot.com
2. Add monitor → HTTP(s) → URL: `https://softcomerce-backend.onrender.com/api/health`
3. Monitoring interval: **5 minutes**

This keeps the backend always warm for your users.

---

## STEP 7 — Custom Domain (Optional, 5 mins)

**On Vercel:**
1. Project → Settings → Domains → Add: `softkart.nskgroups.website`
2. Add CNAME in DNS: `cname.vercel-dns.com`

**Update after custom domain:**
- On Render, update `FRONTEND_URL` and `CORS_ORIGINS` to the custom domain
- On Vercel, update `NEXT_PUBLIC_API_URL` if backend also gets a custom domain

---

## 🗓️ Launch Day Timeline

| When | Action |
|---|---|
| **July 17 (Today)** | Push code, deploy backend to Render |
| **July 17 evening** | Deploy frontend to Vercel, wire CORS |
| **July 18 morning** | Full end-to-end test: submit proposal → check admin → verify email |
| **July 18 afternoon** | Set up UptimeRobot keep-alive |
| **July 19 🎉** | Go live! |

---

## 🔧 Troubleshooting

| Problem | Fix |
|---|---|
| CORS error in browser | `CORS_ORIGINS` on Render must match Vercel URL exactly (no trailing slash) |
| Admin login fails | `SESSION_SECRET` must be set on Render; code is now fixed for HTTPS cookies |
| Proposals not generating | Set `GROQ_API_KEY` or `ANTHROPIC_API_KEY` on Render; test at `/docs` |
| Email not sending | Gmail: use App Password, not account password |
| DB errors at startup | Check `DATABASE_URL` on Render includes `sslmode=require` |
| 502 Bad Gateway | Backend still starting up — wait 30 sec and retry |

---

## 📁 Files Created/Modified

| File | Purpose |
|---|---|
| `backend/render.yaml` | Render auto-deploy configuration |
| `backend/.env.production` | Production env template (not committed) |
| `frontend/.env.production` | Vercel env template (not committed) |
| `backend/app/routes/auth.py` | Fixed: `secure=True` cookie on HTTPS production |
| `DEPLOY.md` | This guide |
