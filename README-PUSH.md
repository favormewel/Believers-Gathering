# Chen Network push notifications

Upload to GitHub (main folder): index.html, sw.js, christ-hub-v3.js, christ-hub-v3.css, vapid-keys.html
Do NOT upload the .sql files or the supabase folder. They are only for copying into Supabase.

Steps
1. Upload the 5 files above and commit.
2. Open https://favormewel.github.io/Believers-Gathering/vapid-keys.html and tap Make my keys. Keep it open.
3. Box 1 goes into config.js (before the closing }). Commit.
4. Supabase SQL Editor, new query each time: run supabase-push-1-tables.sql, then box 2 from the page, then supabase-push-2-functions.sql, then supabase-push-3-triggers.sql.
5. Supabase Edge Functions: create a function named send-push, paste supabase/functions/send-push/index.ts, deploy, turn Verify JWT off, add the four secrets from box 3.
6. In the app: Profile > Turn on notifications. Test with two phones.

Who gets notified
- Likes, comments and new followers: the person concerned
- New updates: the author's followers
- Group messages: group members (not the sender, muted or blocking members)
- New events and announcements: everyone who turned notifications on
