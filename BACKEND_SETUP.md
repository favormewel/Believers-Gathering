# Connect CHRIST HUB to a database (Supabase)

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

## Chat, photos and voice notes
1. In Supabase open **SQL Editor > New query**, paste everything from `supabase/chat.sql`, and tap **Run**. Run it once only.
2. Upload `chat.js` and the updated `index.html` and `data.js` to your site.
3. Sign in. You will see a group called **Welcome Fellowship** under Nearby. Tap **Join**, open it, and chat.

What is saved and shared live between members:
- Text messages, shared verses, photos, files (up to 10 MB) and voice notes.
- Groups people create, and who has joined them.

Notes:
- Only members of a group can read or send its messages.
- Photos, files and voice notes are stored in a public bucket. Anyone who has the exact link can open the file, but the links cannot be guessed. Do not use this for private documents.
- Voice notes need the site to be on https (GitHub Pages is) and the person must allow the microphone.

## Not yet connected
The admin panel and the Bible and Nearby search.

## Safety
- The **anon** key is meant to be public. Row Level Security in `schema.sql` controls what visitors can do.
- Never put the **service_role** key in any file you upload.
