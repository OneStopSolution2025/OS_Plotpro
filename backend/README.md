# OS2 PlotPro — Backend (v0.2, full core)

Multi-tenant SaaS backend for real estate plot promoters: inventory, enquiry/CRM,
bookings, EMI, staff management, customer self-service portal, file uploads, and
automated reminders. FastAPI + PostgreSQL + SQLAlchemy (async).

## What's built

- **Multi-tenancy**: shared DB, `tenant_id` on every business table, enforced in the
  service layer via `get_tenant_id()` dependency (never trusts a tenant_id from the request body).
- **Staff auth**: JWT-based login, role-based access (`ORG_ADMIN`, `SALES_MANAGER`,
  `SALES_EXECUTIVE`, `ACCOUNTANT`, `SITE_SUPERVISOR`, plus `PLATFORM_ADMIN` for OS2's own team).
- **Customer auth**: separate OTP-based login for the self-service portal (`/api/customer-auth/*`)
  — OTPs currently log to console via `services/notifications.py`, swap in Twilio Verify/MSG91
  to go live with real SMS (one-file change, see comments in that file).
- **Tenant onboarding**: platform-admin-only endpoint to create a new promoter + their first admin login.
- **Plot inventory**: Project → Plot hierarchy, status lifecycle (available → hold → booked → sold → registered).
- **Enquiry/CRM**: lead capture, stage tracking, follow-up logs.
- **Bookings**: plot reservation, auto customer creation, cancellation with refund tracking.
- **EMI**: schedule generation, payment recording with auto receipt numbers, ledger snapshot
  (also exposed read-only to customers via `/api/customer-auth/my-ledger/{booking_id}`).
- **Staff management**: attendance marking, monthly targets, commission % and performance/earnings report.
- **Legal documents**: EC/patta/RERA doc repository with file upload (status-tracker, not a
  live govt API integration — TN's EC portal has none public) plus expiry alerts.
- **File uploads**: local-disk storage for now (`/uploads`, static-served) — swap for
  GCS/S3 before production since Railway's filesystem is ephemeral on redeploy (see
  comments in `routers/uploads.py`; you already have working GCS credentials from RapidReportz).
- **Reminders**: APScheduler daily jobs — EMI due-in-3-days + overdue flagging, and
  legal document expiry alerts to the org admin, both routed through the same
  `send_sms()`/`send_whatsapp()` stub as OTP login.

## Not yet built
- Real SMS/WhatsApp provider wiring (stubbed to console log — swap one file: `services/notifications.py`)
- Production file storage (currently local disk — swap one file: `routers/uploads.py`)
- Customer self-service portal frontend (backend is fully ready, see frontend README)

## Setup

```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows PowerShell: venv\Scripts\Activate.ps1
pip install -r requirements.txt

copy .env.example .env
# edit .env — paste your Railway Postgres DATABASE_URL (change postgresql:// to postgresql+asyncpg://)

alembic revision --autogenerate -m "initial schema"
alembic upgrade head

python -m scripts.create_platform_admin
uvicorn app.main:app --reload
```

Visit `http://localhost:8000/docs` for the interactive Swagger UI.

## Typical flow to test end-to-end

1. Login as platform admin (`/api/auth/login`) → get token
2. `POST /api/tenants/onboard` → creates a promoter tenant + their ORG_ADMIN
3. Login as that ORG_ADMIN → get their token
4. `POST /api/plots/projects` → create a project
5. `POST /api/plots` → add plots to it
6. `POST /api/enquiries` → log a lead
7. `POST /api/bookings` → convert to a booking (auto-creates customer, marks plot BOOKED)
8. `POST /api/emi/generate-schedule` → generate installments
9. `POST /api/emi/payments` → record a payment against an installment
10. `GET /api/emi/ledger/{booking_id}` → see paid vs due
11. `POST /api/staff/attendance` and `GET /api/staff/{id}/performance` → staff ops
12. `POST /api/customer-auth/request-otp` then `/verify-otp` (using the tenant's `subdomain`) → customer portal login
13. `POST /api/uploads/legal-document` → attach an EC/patta/RERA file to a project

## Folder structure

```
app/
  core/       — config, db session, security (JWT/hashing), auth dependencies
  models/     — SQLAlchemy models (one file per domain area)
  schemas/    — Pydantic request/response shapes
  routers/    — FastAPI route handlers, grouped by domain
  main.py     — app assembly, CORS, router registration
alembic/      — migrations
scripts/      — one-off ops scripts (e.g. platform admin bootstrap)
```
