# OS2 PlotPro — Customer Self-Service Portal

A separate, lightweight React app for plot buyers — phone + OTP login (not the
staff JWT login used in the admin dashboard), since customers and staff are
different audiences with a different auth flow entirely.

## Setup

```bash
cd customer-portal
npm install
npm run dev
```

Runs on `http://localhost:5174` (separate port from the admin dashboard's 5173),
proxies `/api` to the backend at `http://localhost:8000`.

## How login works

1. Customer enters their **promoter code** (the tenant's `subdomain`, e.g. `dreamcity`)
   and their registered phone number
2. Backend sends a 6-digit OTP (currently logs to console — wire real SMS in
   `backend/app/services/notifications.py` to go live)
3. Customer enters the OTP → gets a customer-scoped JWT (separate token type
   from staff logins, checked via `type: "customer"` claim in the token)

In production, each promoter would have this portal deployed at their own
subdomain (e.g. `portal.dreamcity.com`) with the promoter code baked in via an
env var instead of asked on-screen — that's a one-line change in `pages/Login.jsx`
when you're ready (skip the "Promoter code" field, hardcode `VITE_TENANT_SUBDOMAIN`).

## Pages

- **Login** — two-step phone → OTP flow
- **My Plots** — lists all bookings under the customer's account
- **Ledger** — EMI installment schedule + full payment/receipt history for a booking

## Not yet built
- Self-service document downloads (sale agreement PDF, receipts as downloadable PDFs)
- Support ticket raising
- e-signature flow for agreements

These weren't in the original module list you gave me — say the word if you want them added.
