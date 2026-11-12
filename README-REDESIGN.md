# CHRIST HUB — Midnight Fellowship redesign

## What's changed
- New navy / royal-purple / gold visual theme, optimized for mobile.
- New CHRIST HUB emblem (`christ-hub-logo.svg`) and generated PWA icons.
- Updated PWA theme colors and service-worker cache version.
- Existing app features and JavaScript logic are preserved.

## Important: preserve your live Supabase configuration
This package intentionally does **not** include `config.js`, because the supplied `config-example.js` contains placeholders only.

If your GitHub repository already has a working `config.js`, keep it unchanged. Do not replace it with `config-example.js`.
If you do not have a real `config.js`, copy `config-example.js` to `config.js` and add your Supabase Project URL and anon/public key. Never put a Supabase service-role key or private secret in browser code.

## Upload to GitHub Pages
1. Make a backup of the current GitHub repository first.
2. Extract this ZIP.
3. Upload the contents of the extracted `christ_hub_redesign` folder into the root of your existing repository, keeping the `icons` folder.
4. Replace the existing files when GitHub asks. Keep your existing `config.js` untouched.
5. Commit the changes and wait for GitHub Pages to publish.
6. Open the site and refresh it. If an older version remains cached, close the app/browser tab and reopen the site.

## Included files
The package includes `index.html`, `christ-hub-theme.css`, `christ-hub-logo.svg`, `icons/`, the app JavaScript files, `sw.js`, the web manifest, and the existing install/push setup helper files.

## Notes
- No database schema or Supabase policies were changed.
- No credentials were added or modified.
- The package does not deploy itself; it is ready for you to upload to your GitHub repository.
