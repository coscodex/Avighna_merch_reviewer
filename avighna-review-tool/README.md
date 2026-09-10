# Avighna'26 — Print Proof Sheet

A single-page tool to review, edit, font-style, and export merch print names. Runs entirely in the browser — no backend to maintain — with an optional live collaboration layer via Firebase, so your whole team can review the same board together in real time.

## Deploying the site

### Option A — GitHub Pages (free, simplest)
1. Create a new GitHub repo (or use an existing one), add `index.html` to the root.
2. Go to **Settings → Pages** → Source: **Deploy from a branch**, branch `main`, folder `/ (root)`. Save.
3. Live within a minute or two at `https://<your-username>.github.io/<repo-name>/`.

### Option B — Vercel (free, also simple)
1. Push this folder to a GitHub repo.
2. [vercel.com](https://vercel.com) → **Add New → Project** → import the repo.
3. Framework preset: **Other** (static file, no build step needed). Deploy.

## Setting up live collaboration (optional, ~5 minutes)

Without this step, the tool still works great, just locally per-browser (each person needs their own CSV load). With it, everyone sees the same board update live.

1. Go to [console.firebase.google.com](https://console.firebase.google.com) → **Add project** → give it any name (e.g. `avighna-merch`) → you can skip Google Analytics → **Create project**.
2. In the left sidebar: **Build → Firestore Database → Create database**. Choose a location close to you, and start in **Test mode** (this allows open read/write — fine for this internal, non-sensitive use case, but see the security note below).
3. Back in the project overview, click the **`</>`** (web) icon to register a new web app. Give it any nickname, skip Firebase Hosting (you're already using GitHub Pages/Vercel).
4. Firebase will show you a code block with a `firebaseConfig` object — it looks like:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "avighna-merch.firebaseapp.com",
     projectId: "avighna-merch",
     storageBucket: "avighna-merch.appspot.com",
     messagingSenderId: "...",
     appId: "..."
   };
   ```
5. Copy **just the object** (the part inside `{ }`) and paste it into the app: open the deployed site → **Settings → Collaboration** → paste into the box → **Connect**.
6. Share that same config with your team (e.g. drop it in your group chat) — everyone pastes the same config into their own Settings panel once, and you're all looking at the same live board.

The little dot next to the title turns green and says "live · syncing" once connected.

### What syncs live
- Edited names, font selections, and the "reviewed" checkbox — instantly, to everyone connected.
- Loading a CSV seeds new entries into the shared board without overwriting names/fonts/review status a teammate already edited (only the raw sheet fields like timestamp/orderer/language refresh).

### What stays local (by design)
- Custom uploaded font files (per-card "Upload font", and the global Impact/Hindi font uploads in Settings) — these aren't synced, since font files are large binaries not well-suited to a live database. If everyone needs the same custom font, each person uploads that file once in their own Settings.
- Column mapping and default font choices — local per-browser convenience, doesn't need to be shared.

### Security note
Firestore's "test mode" allows anyone with your config (which is not a secret, just a client identifier) to read and write your data for 30 days, after which it locks by default. Since this only ever holds t-shirt names and font choices for an internal college event, this is a reasonable trade-off for zero backend code. If you want it locked down longer-term, add Firestore security rules restricting writes to a shared password/token — ask me if you want this built in.

## Fonts

- `Impact` is a system font, not downloadable from Google Fonts. Live preview looks right if the viewer's computer already has it (true on most Windows/Mac machines). For the **downloaded SVG** to embed it properly, upload the actual `Impact.ttf` once in Settings (typically at `C:\Windows\Fonts\Impact.ttf` on Windows, or via Font Book on Mac).
- `Yatra One` is a real Google Font — embeds automatically, no upload needed.
- Any font uploaded per-card always embeds correctly.

## Other notes

- "Fetch link" CSV loading depends on the browser allowing the cross-origin request — can be blocked by Google's headers. **Uploading a CSV is the reliable path.**
- Google Drive handwriting reference images only display if sharing is set to "Anyone with the link can view."
- Sorting toggles between "name printed on shirt" (handles people ordering for someone else) and "orderer's name."
