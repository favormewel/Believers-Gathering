# CHRIST HUB v17 — Events, Community posts, Followers

## Step 1 (do first): Supabase
Open Supabase > SQL Editor, paste all of `supabase-events-posts.sql`, and run it once.
It only adds 4 new tables (events, event_rsvps, posts, follows). Nothing existing is changed.

## Step 2: GitHub
Back up your repo, then upload every file here and replace when asked.
Keep your own `config.js` and `icons` folder untouched. Wait for GitHub Pages, then close and reopen the app.

## What's new
- Explore > Events: upcoming events, "I'm going" with a count, Create Event form, delete your own events
- Home > Community: share updates, see others' updates, Follow / Following
- Profile: stats now show Groups, Posts, Followers; new "My posts" screen with delete
- People you have blocked are hidden from the feed

## Files
NEW: christ-hub-v3.js, christ-hub-v3.css, supabase-events-posts.sql
CHANGED: index.html, sw.js (cache fl-v17)
