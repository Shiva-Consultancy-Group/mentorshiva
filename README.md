# mentorshiva.com — Shiva Consultancy Group

Institutional advisory portal: Liaisoning & Lobbying, MSME Growth, Intelligence Portal, Sustainability & ESG.

## Stack

- **Frontend**: static HTML + Tailwind CDN (deployed via GitHub Pages)
- **Backend**: Supabase (Postgres, Auth, Storage)
- **Host**: GitHub Pages with custom domain `mentorshiva.com`

## Structure

```
/
├── index.html               Homepage — 3 pillars, sustainability calculator, whitepapers
├── lobbying.html            Lobbying & Liaisoning Vault
├── msme.html                MSME Growth & Mentoring Hub
├── intelligence.html        Intelligence Portal
├── sustainability.html      Sustainability & ESG
├── inquiry/index.html       3-step inquiry submission form (standalone module)
├── admin/
│   ├── login.html
│   ├── index.html           Dashboard with KPI counts + recent inquiries
│   ├── inquiries.html       Live inquiries inbox (realtime via Supabase)
│   ├── contacts.html        Contacts CRM (clients, prospects, partners, govt)
│   ├── documents.html       Document vault (per-page upload, public/private)
│   └── profile.html         Account + password change + invite partners
├── assets/
│   ├── config.js            Runtime config (Supabase URL + anon key)
│   ├── supabase.js          Supabase client + helpers (module)
│   ├── admin.js / admin.css Admin shell + styles
│   ├── inquiry-form.js      Standalone 3-step inquiry form (module)
│   ├── inquiry-form.css     Inquiry form styles (separate module)
│   └── resources-widget.js  Per-page public document list
├── CNAME                    Custom domain pin
└── .nojekyll                Disable Jekyll processing on GitHub Pages
```

## Database schema (Supabase public schema)

- `profiles`   — extends auth.users with `role` (admin|partner)
- `inquiries`  — public form submissions (anonymous INSERT allowed)
- `contacts`   — CRM directory (authenticated CRUD)
- `documents`  — metadata for uploaded files (storage bucket: `documents`)

RLS is on for all tables. Public can only INSERT inquiries and SELECT `documents` rows marked `is_public=true`.

## Admin access

- Seeded: `admin@mentorshiva.com` / `India@123`
- **Change this password on first login** (Profile → Change password).
- Admins can invite partners (Profile page → Invite). Partners can triage inquiries, manage contacts, and upload documents.

## Local preview

Just open `index.html` in a browser — no build step. Form submissions and document uploads require internet access to Supabase.

## Deployment

GitHub Pages auto-deploys on push to `main`. DNS points `mentorshiva.com` (apex) and `www` to GitHub Pages.
