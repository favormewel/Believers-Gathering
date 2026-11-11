# Connect CHRIST HUB to a database (Supabase)

1. Go to supabase.com, sign up, and create a **New project** (name it christ-hub, save the database password, pick the nearest region, Free plan). Wait until it is ready.
2. Open **SQL Editor**, then **New query**. Paste everything from `supabase/setup.sql` and tap **Run**. It is safe to run again.
3. Open **Authentication**, then **Sign In / Providers**, then **Email**, and turn **Confirm email** off while testing (the free email service sends only a few emails an hour). Open **URL Configuration** and set **Site URL** to your site address.
4. Open **Project Settings**, then **API Keys**. Copy the **Project URL** and the **Publishable key** (starts with sb_publishable_). If you only see Legacy API keys, copy the **anon** key. Never use the secret or service_role key.
5. Edit `config.js` in your repository and replace the two placeholder values.
6. Open `/backend-check.html` on your site. It tests the connection, tables, sign-in settings and file storage.
7. Create your own account in the app. Then in the SQL Editor run the last line of `setup.sql` (remove the two dashes, put your email in). The Admin panel row now shows in Profile.

## What is saved
Groups and members, group chat (text, photos, files up to 10 MB, voice notes, shared verses, live), prayer requests (they appear after an admin approves them) and member names.

## Notes
- Chat files are stored where anyone with the exact link can open them. The links cannot be guessed, but do not use this for private documents.
- Voice notes need https (GitHub Pages is) and the microphone allowed.
- Only members of a group can read its messages. Members cannot make themselves admin.
- Free Supabase projects pause after about a week of no use. Move to the paid plan when the church depends on it.

## Already ran setup.sql before? (chat list update)
The groups list now works like WhatsApp: only your groups, newest chat first, the last message with its time, and unread counts. This needs one small database update. In Supabase open **SQL Editor**, paste everything from `supabase/update-groups.sql`, and tap **Run** (once). New installs already have it inside setup.sql. If you skip it, groups still show, but without the last message and unread counts.

## Update 2: group admin tools, safety, announcements and events
Already ran setup.sql before this version? In Supabase open **SQL Editor**, paste everything from `supabase/update-2.sql`, and tap **Run** once. New installs already have it inside setup.sql.

What it adds:
- **Group admin tools that are saved:** rename a group, change its description, pin a verse, make or remove admins, remove members, approve join requests, "Only admins can send messages", "Approve new members", mute notifications, an invite link, and delete a group. Every action is checked by the database, so only group admins can do them.
- **Safety:** members can report a message, block a member, and delete their own messages. Group admins can delete any message in their group. App admins see reported messages in the admin panel (Reports) and can delete the message, delete it and ban the author, or dismiss the report. Banned members can no longer send messages.
- **Announcements and events:** app admins post them from the admin panel. Members see them under the bell (Updates), with a red dot for new ones, and can mark Going or Maybe on events.

## Easiest way to update an existing database: update-all.sql
If you already ran setup.sql earlier, run `supabase/update-all.sql` ONCE instead of the smaller update files. It contains the chat-list update and update 2 together and works whatever you ran before.
- Open **SQL Editor**, then **New query**. Paste the whole script. Make sure no text is selected, because Supabase runs only the selected part.
- Tap **Run**. If a box asks you to confirm because the script changes rules, tap **Run this query**.
- A green "Success. No rows returned" means it worked. A red message means it failed: send me that exact message.

## Push notifications
See `PUSH_SETUP.md`. It needs `supabase/push.sql`, the `send-push` function and four secrets.
