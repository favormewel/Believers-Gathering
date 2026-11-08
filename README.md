# CHRIST HUB

A Christian community app: groups and group chat (messages, photos, files, voice notes, shared verses), prayer requests, the whole Bible, profiles, an admin panel, and install-as-an-app.

## Put it on your site (GitHub)
1. Unzip this package. Everything is at the top level, with no extra folder around it.
2. In your GitHub repository choose **Add file**, then **Upload files**. Drag in ALL the files and the two folders `icons` and `supabase` (and `tools` if you like). Commit.
3. **Keep your own `config.js`.** It holds your Supabase address and key, and this package does not contain one, so uploading will not erase it. Only if you have no config.js yet: copy `config-example.js` to a new file named `config.js` and fill in the two values.
4. Wait two minutes and open your site in a private tab. Open Profile and scroll down: it should say "version 12".

## What is in the package
- `index.html` the app, and `admin.html` the admin panel (open it at `/admin.html`)
- `data.js`, `chat.js`, `bible.js`, `boot.js`, `install.js` the app code
- `sw.js`, `manifest.webmanifest`, `icons/` make it installable on a phone
- `supabase/setup.sql` the whole database in one script (see BACKEND_SETUP.md)
- `install-check.html`, `app-check.html`, `backend-check.html` check pages. Open them on your site if something does not work. You can delete them later.
- `tools/build_bible.py` optional, to host the Bible text yourself

## If something does not work
- Opens but nothing happens, or stuck on the logo: open `/app-check.html`. It lists missing or broken files.
- Cannot install on the phone: open `/install-check.html`.
- Sign-in, groups or chat do not work: open `/backend-check.html`.

## Groups (like WhatsApp)
Only your own groups are listed, newest conversation first, with the last message, its time and an unread count. Tap a group to chat: messages show the sender, the time and the day (Today, Yesterday). Search filters your groups. Create a group with + and it opens straight away. Find other groups under Nearby and tap Join. Group info lists the real members, and Leave group works. Needs `supabase/update-groups.sql` once if you installed before this version.

## The Bible
All 66 books and 1,189 chapters, verse by verse, with search ("John 3:16"), five translations, highlights, bookmarks, copy and share to a group. By default each chapter is loaded from the free service bible-api.com, and chapters you have read are kept on the phone. That service is run by one person and can be slow or limited. For a dependable app, host the text yourself:
1. On your computer, download a file such as `eng-kjv.osis.xml` from https://github.com/seven1m/open-bibles (public domain).
2. Run `python3 tools/build_bible.py eng-kjv.osis.xml kjv`. It makes a `bible/kjv/` folder of 66 small files.
3. Upload the `bible` folder next to `index.html`, and add `BIBLE_BASE_URL:"bible"` inside your `config.js` settings.
The converter was tested on small sample files only. Open a few chapters to check them first.

## Admin panel
Open `/admin.html` and sign in with an account marked as admin (see BACKEND_SETUP.md). Admins can approve or remove prayer requests, see and delete groups, and see members. Admins also see an Admin panel row in Profile.

## Opening the app and installing
A short logo screen, then three welcome slides for new members (replay from Profile). Signed-in members stay signed in and return to where they left off. On Android a bar offers Install; on iPhone use Safari, Share, Add to Home Screen.
