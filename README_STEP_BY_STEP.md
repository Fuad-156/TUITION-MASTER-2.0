# Tuition Master — Professional Setup Guide

This project is a premium single-page web app built with HTML, CSS, JavaScript, Supabase, and GitHub Pages. It includes authentication, teacher search, request management, manual bKash payment verification, realtime chat, schedules, attendance, study materials, admin dashboard, CSV export, dark mode, and PWA support.

## 1. Files included

```txt
Tuition Master/
├── index.html                 # Main app UI
├── css/styles.css             # Premium responsive styling
├── js/app.js                  # App logic + Supabase integration
├── app-config.json            # Supabase URL, anon key, admin emails, bKash number
├── manifest.json              # PWA manifest
├── sw.js                      # Service worker for offline shell caching
├── supabase-setup.sql         # Full Supabase database + RLS setup
├── assets/icon.svg            # App icon
└── data/
    ├── app-content.json       # Language/content source file
    └── bd-holidays.json       # Bangladesh holiday data source file
```

## 2. Create Supabase project

1. Go to Supabase and create a new project.
2. Open **Project Settings → API**.
3. Copy:
   - Project URL
   - Anon public key
4. Open **SQL Editor → New query**.
5. Paste the full `supabase-setup.sql` file and run it.

## 3. Set your admin email

In Supabase SQL Editor, run this after replacing the email:

```sql
update public.app_settings
set value = '["your-real-admin-email@gmail.com"]'::jsonb
where key = 'admin_emails';
```

After creating the admin account from the website, run:

```sql
update public.profiles
set role = 'admin', status = 'approved', verified = true
where email = 'your-real-admin-email@gmail.com';
```

## 4. Update app-config.json

Open `app-config.json` and replace these values:

```json
{
  "supabaseUrl": "https://YOUR_PROJECT_REF.supabase.co",
  "supabaseAnonKey": "YOUR_SUPABASE_ANON_PUBLIC_KEY",
  "adminEmails": ["your-real-admin-email@gmail.com"],
  "bkashNumber": "01XXXXXXXXX"
}
```

Keep the `studentServiceFeeRate` as `0.10` and `teacherCommissionRate` as `0.20` for your project model.

## 5. Supabase Auth settings for testing

For fast project demo:

1. Go to **Authentication → Providers → Email**.
2. Keep Email provider enabled.
3. For local/demo testing, you may disable email confirmation.
4. In production, keep email confirmation enabled.

## 6. Run locally

Do not open `index.html` directly by double-clicking because browser service workers and fetch calls work best through a local server.

Use one of these:

```bash
python -m http.server 5500
```

Then open:

```txt
http://localhost:5500
```

## 7. Test flow

1. Create a teacher account.
2. Complete teacher profile with subjects, district, class levels, fee, qualification.
3. Login as admin and approve the teacher.
4. Create a student account.
5. Search approved teacher from **Teachers** page.
6. Submit tuition request and bKash transaction ID.
7. Login as admin and verify payment.
8. Open Chat, Schedule, Attendance, and Materials from Dashboard.

## 8. Deploy to GitHub Pages

1. Create a new GitHub repository.
2. Upload all files to the repository root.
3. Go to **Settings → Pages**.
4. Source: `Deploy from a branch`.
5. Branch: `main`, folder: `/root`.
6. Save and wait for the live URL.

## 9. Important production notes

- Never use the service role key in frontend code.
- Only use the Supabase anon public key in `app-config.json`.
- Keep RLS enabled.
- Update admin email both in `app-config.json` and `app_settings` SQL table.
- For real payments, integrate official bKash API later. This version uses manual transaction ID verification as described in the project report.
- Update `data/bd-holidays.json` yearly before production use.

## 10. Common errors

### Supabase connect হয়নি
`app-config.json` still has placeholder Project URL or Anon Key.

### Teacher not showing
Admin has not approved the teacher. Update from Admin Dashboard or SQL.

### Admin dashboard not showing
Your login email must be included in both:

1. `app-config.json` → `adminEmails`
2. Supabase `app_settings` table → `admin_emails`

### File upload failing
Confirm the `materials` storage bucket was created by running `supabase-setup.sql`.
