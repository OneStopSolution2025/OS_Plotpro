# OS2 PlotPro

Full-stack, multi-tenant real estate management platform — built for OS2 Studio to
run in-house and resell to other plot promoters.

```
os2-plotpro/
  backend/           FastAPI + PostgreSQL API (see backend/README.md)
  frontend/          React + Vite admin dashboard (see frontend/README.md)
  customer-portal/   React + Vite customer self-service portal (see customer-portal/README.md)
```

## Quick start

**1. Backend**
```bash
cd backend
python -m venv venv
venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env    # paste your Railway Postgres DATABASE_URL
alembic revision --autogenerate -m "initial schema"
alembic upgrade head
python -m scripts.create_platform_admin
uvicorn app.main:app --reload
```

**2. Admin dashboard**
```bash
cd frontend
npm install
npm run dev          # http://localhost:5173
```

**3. Customer portal**
```bash
cd customer-portal
npm install
npm run dev          # http://localhost:5174
```

Open the admin dashboard first, but you'll need at least one tenant + org admin
login before that works — use the platform admin account from step 1 to hit
`POST /api/tenants/onboard` (via `/docs` Swagger UI) and create your first promoter.

## What's complete
Everything discussed: plot inventory with visual map, enquiry/CRM, bookings, EMI +
billing, staff management with commission tracking, EC/legal document tracking with
expiry alerts, customer self-service portal (backend **and** frontend), and automated
EMI/document reminder jobs.

## What's stubbed for you to wire in when going live
- **SMS/WhatsApp**: currently logs to console (`backend/app/services/notifications.py`).
  Swap in Twilio Verify — same pattern you already have working in WashPro.
- **File storage**: currently local disk (`backend/app/routers/uploads.py`). Swap in
  GCS — same bucket/credential pattern already working in RapidReportz.

Full details and the exact API flow to test everything are in each folder's README.
