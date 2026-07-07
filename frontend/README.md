# OS2 PlotPro — Frontend (Admin Dashboard)

React + Vite + Tailwind admin panel for OS2 PlotPro.

## Setup

```bash
cd frontend
npm install
npm run dev
```

Runs on `http://localhost:5173`, proxies `/api` and `/uploads` to the backend at
`http://localhost:8000` (see `vite.config.js` — change this before deploying).

## Pages

- **Login** — staff JWT login
- **Dashboard** — quick stats (total plots, available, enquiries, bookings)
- **Projects & Plots** — create projects, add plots, visual plot grid with
  click-to-change status (available/hold/booked/sold/registered)
- **Enquiries** — CRM lead capture and stage tracking
- **Bookings** — convert an enquiry/walk-in into a booking, cancel with refund tracking
- **EMI & Payments** — generate installment schedules, record payments, live ledger snapshot
- **Staff** — set targets/commission %, view performance
- **Legal Documents** — upload EC/patta/RERA docs, track validity

## Not yet built
- Customer self-service portal UI (backend OTP auth is ready at `/api/customer-auth/*` —
  this needs a separate lightweight portal app, since it's a different audience/login flow
  from the admin dashboard)
- Layout image upload UI for the clickable map overlay (backend endpoint exists:
  `POST /api/uploads/project-layout/{project_id}`)

## Before deploying to Railway
- Set `vite.config.js` proxy target to your deployed backend URL, or better, use an
  env var (`VITE_API_URL`) and switch `api/client.js` to read from it
- Run `npm run build` and serve the `dist/` folder (Railway static site or Nginx)
