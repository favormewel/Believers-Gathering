# CHEN NETWORK v20 — app icon fix

## Upload to GitHub
1. Back up your repo.
2. Upload every file and folder from this zip, replacing when asked (including `icons`).
3. Keep your own `config.js`.
4. Commit, wait a minute.

## Get the new icon on your phone
Phones keep the old icon until you re-add it:
1. Delete the old Chen Network / CHRIST HUB shortcut from your home screen.
2. Open the site in your browser and refresh twice.
3. Use Add to Home Screen (iPhone: Share > Add to Home Screen; Android: menu > Install app).

## What changed
- install.js no longer draws the old gold cross icon. It was overriding the real icon on iPhone and as the fallback on Android.
- The install banner now shows the Chen Network "C" mark.
- Icon links carry ?v=20 so browsers fetch the new files.
