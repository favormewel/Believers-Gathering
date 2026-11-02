# Connect Fellowship to a database (Supabase)

Supabase is free to start and saves your data online.

1. Go to supabase.com, create an account and a **New project**. Save the database password.
2. Open **SQL Editor > New query**, paste everything from `supabase/schema.sql`, and tap **Run**.
3. Open **Project Settings > API**. Copy the **Project URL** and the **anon public** key.
4. Open `config.js` and replace `YOUR_SUPABASE_URL` and `YOUR_SUPABASE_ANON_KEY` with those two values.
5. Upload the updated files to GitHub (or your host) and open the site.

## What is saved now
- **Prayer wall:** people send requests from the app. They are saved as **pending**. In **Table editor > prayer_requests**, change `status` to `approved` to show one, or `removed` to hide it. The "I prayed" count is saved too.

- **Accounts:** people can create an account and sign in with email and password. Their name then shows on Home and Me. Without Supabase, "Sign in" simply opens the app as a guest.

## Sign-in settings (Supabase)
- **Authentication > Providers > Email** is on by default. If "Confirm email" is on, new members get a confirmation email first.
- **Authentication > URL Configuration:** set **Site URL** to your live website address so email links come back to your app.

## Not yet connected
Chat messages, the admin panel and devotions. The `devotions` table is ready for the next step.

## Safety
- The **anon** key is meant to be public. Row Level Security in `schema.sql` controls what visitors can do.
- Never put the **service_role** key in any file you upload.
