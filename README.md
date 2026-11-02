# Fellowship

Fellowship: a Christian community app with groups, group chat, prayer requests, a Bible reader, a profile, and an admin panel.

## Files
- `index.html` : the app (open on a phone or in a narrow browser window)
- `admin.html` : the admin dashboard (protect it before going live)

## Save your data
See `BACKEND_SETUP.md` to connect a free Supabase database (files: `config.js`, `data.js`, `supabase/schema.sql`).

## Deploy (static hosting, no build step)
1. **Netlify:** go to app.netlify.com/drop and drag this folder in.
2. **GitHub Pages:** upload the files to a repository, then Settings > Pages > deploy from the main branch.
3. **Vercel / any web host:** upload the folder as a static site.

Your site opens at `/` (the app) and `/admin.html` (the admin panel).

## Customize
- Replace text in [square brackets] with your own content.
- Change colors by editing the hex values: gold `#E2B04E`, cream `#FDF3E3`, text `#222222`, blue `#2F5BD8`.

## Before a real launch
This is a front-end prototype: messages, prayers and devotions are not saved and there are no accounts. Add a backend (for example Firebase or Supabase) for sign-in, saved chats, prayer requests and devotions, and put `admin.html` behind a login.
