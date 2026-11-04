# Finity

## Run locally

1. Create a Supabase project.
2. In the Supabase SQL Editor, run `server/schema.sql`.
3. Copy `server/.env.example` to `server/.env`, then set the Supabase project URL, anon key, and service-role key from **Project Settings → API**.
4. In Supabase **Authentication → URL Configuration**, add `http://localhost:5173/reset-password` to the allowed redirect URLs.
5. In **Authentication → Providers**, enable email/password sign-in. Supabase sends confirmation and password recovery emails; this project does not configure a custom SMTP server.
6. Run:

       npm install
       npm run dev:all

The frontend runs on port 5173 and the API on port 4000. Keep `SUPABASE_SERVICE_ROLE_KEY` private in `server/.env`; never expose it in frontend code or commit `.env` files.

## Admin setup

Set `ADMIN_EMAIL` in `server/.env` to the admin account email and restart the API. The server promotes a matching Supabase account. To create that account automatically when it does not exist, also set `ADMIN_PASSWORD` to a strong password and optionally set `ADMIN_NAME`. The password is only read from the ignored local `.env`; it is not stored in source code. If the account already exists, its password is not changed. Admin status is checked by the API for every admin request.

Admins are sent to `/admin` after sign-in. The admin page shows app-wide user, income, expense, and feedback counts; supports searching users by name or email; lists up to 100 recent feedback messages; and allows admins to delete regular users and their associated data. Admin accounts and the current admin cannot be deleted from this screen.

## Data and authentication

Supabase Auth handles account registration, login, refresh, and password recovery. Income, expenses, feedback, and user profiles are stored in Supabase Postgres. `server/schema.sql` creates the tables, profile trigger, indexes, and row-level security policies. The Express API uses the service key only on the server and checks the caller's Supabase access token before accessing user or admin data.

Existing SQLite accounts and records are not automatically copied to Supabase. Users need to register in the new Supabase-backed app; transfer existing data separately if it must be retained.

## API

All endpoints except registration, login, session refresh, password reset requests, feedback, and health are authenticated using a Supabase bearer access token.

| Method | Path | Purpose |
|---|---|---|
| POST | `/api/auth/register` | Create Supabase Auth account |
| POST | `/api/auth/login` | Sign in |
| POST | `/api/auth/refresh` | Refresh session |
| GET | `/api/auth/me` | Current profile |
| POST | `/api/auth/forgot` | Send Supabase password recovery email |
| POST | `/api/auth/reset-password` | Set password using recovery access token |
| GET | `/api/income` | List income records |
| POST | `/api/income` | Add income |
| DELETE | `/api/income/:id` | Remove income record |
| GET / POST | `/api/expenses` | List or add expenses |
| PUT / DELETE | `/api/expenses/:id` | Update or remove expense |
| DELETE | `/api/expenses` | Delete all expenses for the current user |
| GET | `/api/summary` | Monthly income, expenses, savings, and daily safe spend |
| GET | `/api/admin/users` | Admin-only user list and entry counts |
| GET | `/api/admin/overview` | Admin-only app-wide counts |
| GET | `/api/admin/feedback` | Admin-only list of the latest 100 feedback messages |
| DELETE | `/api/admin/users/:id` | Admin-only deletion of a regular user |
| POST | `/api/feedback` | Save feedback |

## Features

- Light and dark themes, saved in the browser.
- Currency display options: INR, USD, YEN, and YUAN (no conversion).
- Forecast uses monthly income plus weekly income scaled by days in the month.
- `/reset` confirms before clearing all expenses.
- Demo dashboard uses local sample data.
