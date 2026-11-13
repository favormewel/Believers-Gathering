# CHRIST HUB — Showcase layout (v16)

## What's new
- Splash + Welcome screen (Create Account / Sign In / Continue as Guest)
- Bottom tab bar on every main screen: Home, Groups, Prayer, Bible, Profile
- Home dashboard: greeting, quick actions, your groups, verse of the day, Explore link
- Messages list (reads your existing groups; tapping opens the real chat)
- Explore: Nearby / Trending / Events tabs
- Settings screen (gear on Profile): Account, Notifications, Blocked People, Log Out
- "Need Prayer?" card on Prayer; restyled tabs, Bible, Chat, Notifications, Profile

## Files changed or added
NEW: christ-hub-v2.css, christ-hub-v2.js
CHANGED: index.html, boot.js (app now opens on Home), data.js (login/sign-up land on Home), sw.js (cache fl-v16)
UNCHANGED: chat.js, social.js, bible.js, push.js, install.js, manifest, theme css

## Upload to GitHub
1. Back up your repository.
2. Upload every file from this folder to the repo root and replace when asked.
3. Do NOT upload config-example.js as config.js. Keep your existing config.js and your icons folder untouched.
4. Commit, wait for GitHub Pages, then close and reopen the app once so the new version loads.

## Notes
- No Supabase tables, policies or keys were changed.
- Events and Trending are simple for now: Events shows an empty state until you add an events feature.
