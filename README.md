# CHRIST HUB

CHRIST HUB: a Christian community app with groups, group chat, prayer requests, a Bible reader, a profile, and an admin panel.

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

## The Bible
The Bible tab has all 66 books and 1,189 chapters, verse by verse. You can search (for example "John 3:16" or "Romans 8"), switch translation (KJV, WEB, ASV, BBE or Darby), make the text bigger or smaller, highlight and bookmark verses, copy them, and share them into a group chat. Your highlights, bookmarks and last place are saved on each person's phone.

By default the text is loaded one chapter at a time from the free service bible-api.com, and every chapter a person has opened is kept on their phone so it opens again instantly and offline. That service is run by one person, is limited to 15 requests per 30 seconds for each visitor, and can be slow or down. For a reliable church app, host the text yourself:

1. On your computer, download an XML file from https://github.com/seven1m/open-bibles (for example `eng-kjv.osis.xml`, `eng-asv.zefania.xml` or `swa-swahili.osis.xml`). They are all public domain.
2. Run: `python3 tools/build_bible.py eng-kjv.osis.xml kjv`. This makes a `bible/kjv/` folder with 66 small files.
3. Upload the `bible` folder to your GitHub repository, at the top level next to `index.html`. (GitHub's web page takes up to 100 files at a time, so do one translation per upload.)
4. In `config.js`, add this line inside the settings: `BIBLE_BASE_URL:"bible"`
5. The folder name is the translation code. The app's list uses kjv, web, asv, bbe and darby, so use those codes for the files you add.

I tested the converter on small sample files only, not on the full downloads. Run it, then open a few chapters to check them before you tell people.

## Admin panel
Open `admin.html` on your site (for example `https://YOUR-SITE/admin.html`). Inside the app, admins also see an **Admin panel** row at the bottom of the Profile tab.

To turn it on:
1. In Supabase run `supabase/admin.sql` once (SQL Editor). It adds an admin flag and the admin rules.
2. Make yourself the first admin: in the SQL Editor run the commented line at the bottom of `admin.sql` with your email in it. Create your account in the app first.
3. Open `admin.html`, sign in, and you can approve or remove prayer requests, see and delete groups, and see members.

Anyone can open the `admin.html` page, but it only shows data to accounts marked as admin, and Supabase itself refuses admin actions from everyone else.

## Opening the app
- A short splash screen with the logo shows first.
- New members then see three welcome slides (once only). They can skip them. People can see them again from Profile, "Show the welcome tour".
- After that, anyone who is signed in stays signed in. The app opens on the screen they were last on: their tab, their Bible chapter, or their last group chat.
- If a database is connected and nobody is signed in, the app opens on the sign-in screen.

## Install as an app
CHRIST HUB can be installed on a phone like a normal app, with its own icon, opening full screen with no browser bar, and opening again without internet.
- **Android (Chrome):** the app shows an "Install CHRIST HUB" bar, and there is an "Install the app" row in Profile. Tap Install.
- **iPhone (Safari):** tap the Share button, then "Add to Home Screen". The same bar and Profile row show these steps.
- It needs your site to be on https, which GitHub Pages is. Upload the `icons` folder, `manifest.webmanifest`, `sw.js` and `install.js` next to `index.html`.
- The app checks for new files every time it opens online, so your updates still reach people. If someone still sees the old version, closing and reopening the app fixes it.
