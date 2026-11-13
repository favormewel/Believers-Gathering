# Push notifications (Chen Network)

Members get a phone notification when someone posts in one of their groups, and when an admin posts an announcement or an event. Muted groups and blocked members are skipped. People turn it on themselves under Profile, Turn on notifications.

You do this setup once. It takes about 20 minutes.

## What you need
- The app already working with Supabase (setup.sql and update-all.sql run).
- Your site on https (GitHub Pages is).
- On iPhone: iOS 16.4 or newer, and the app installed from Safari (Share, Add to Home Screen). Notifications do not work in a normal Safari tab on iPhone.

## Step 1. Make your keys
1. Upload everything from the package to your repository (including `vapid-keys.html`, `push.js`, `sw.js` and the `supabase` folder).
2. Open `https://YOUR-SITE/vapid-keys.html`. Type your email, check the Supabase address, and tap **Make my keys**.
3. Keep this page open. It shows everything you need for steps 2 to 4.

## Step 2. Public key into config.js
Open `config.js` in GitHub. Inside the settings, right before the closing `}`, paste the first box from the page. It starts with a comma. The file should look like this (your own values stay as they are):
`window.FAITHLINK_CONFIG={SUPABASE_URL:"...",SUPABASE_ANON_KEY:"...",VAPID_PUBLIC_KEY:"..."};`
Commit.

## Step 3. The database
In Supabase, open **SQL Editor**:
1. Paste **PART 1** of `supabase/push.sql` (everything above the line that says PART 2) and run it.
2. Paste the second box from the keys page and run it. It already has your project address and secret filled in.

## Step 4. Deploy the sender
1. In Supabase open **Edge Functions**, then **Deploy a new function** (choose **Via Editor** if asked).
2. Name it exactly `send-push`.
3. Delete the sample code and paste everything from `supabase/functions/send-push/index.ts`. Deploy.
4. Open the function's settings and turn **Verify JWT** OFF (the secret header protects it instead). The label may vary by version of the dashboard.
5. Open **Edge Functions, Secrets** and add the four secrets from the third box on the keys page, with exactly these names: `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`, `VAPID_SUBJECT`, `PUSH_SECRET`.

## Step 5. Try it with two phones
1. On each phone open the installed app, go to **Profile**, tap **Turn on notifications**, and allow it.
2. On phone A send a message in a group both phones are in. Phone B should get a notification. Tapping it opens that group.

## If nothing arrives
- Profile should say "Notifications are on". If it says blocked, allow notifications for the site in the phone's settings.
- Open the `send-push` function in Supabase and read its **Logs**. A 401 means the secret in the SQL and the PUSH_SECRET secret do not match: run step 3 part 2 again with the page's boxes and re-add the secret.
- Check the trigger ran: in SQL Editor, `select * from net._http_response order by created desc limit 5;`.
- The person who sent the message does not get a notification. Muted groups and blocked members do not notify.
- Free Supabase limits apply to function calls. Each new message is one call, so check your plan on the pricing page.

## Keep these private
The private key and PUSH_SECRET are passwords. They belong only in Supabase secrets and in the SQL you ran. Never put them in your website files.
