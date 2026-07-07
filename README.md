# Graphic Designer Portfolio

A portfolio site for showcasing artwork (images) and motion work (video), with a
Node.js admin panel for adding, editing, reordering, and deleting pieces —
no code changes needed to update the site.

## What's included

- **Public site** (`public/index.html`) — a resume/profile section at the
  top (bio, contact info, skills, education, experience, references,
  languages, hobbies) followed by a filterable image/video gallery styled
  like a contact sheet / film strip, with a lightbox for each piece.
- **Admin panel** (`/admin`) — a login-protected dashboard with two parts:
  1. **Edit resume / profile** — update your name, title, bio, contact
     details, profile photo, and every resume section (skills, education,
     experience, references, languages, hobbies) with add/remove rows.
  2. **Portfolio manager** — upload new work, edit existing entries,
     reorder them by drag-and-drop, and delete pieces.
- **Backend** (`server.js`) — Express server with session-based auth, file
  uploads (Multer), and two small JSON files as the database
  (`data/profile.json` and `data/portfolio.json`). No external database
  required.

The resume section ships pre-filled with your CV details (Chhith Vachhy —
Graphic Designer) as a starting point — edit or replace any of it from
`/admin` at any time.

## Setup

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Create your admin account**

   This writes a hashed password (never plain text) into a local `.env` file.

   ```bash
   npm run create-admin
   ```

   You'll be prompted for a username and password. Keep these safe — this is
   the only way to log into `/admin`.

3. **Start the server**

   ```bash
   npm start
   ```

   Or, for auto-restart during development:

   ```bash
   npm run dev
   ```

4. Open the site:

   - Public portfolio: http://localhost:3000
   - Admin login: http://localhost:3000/admin

## Editing your resume

Log in at `/admin` and use the **Edit resume / profile** panel at the top:

- **Name, title, bio, phone, website/telegram, location, photo** — the
  basic info shown at the top of the site.
- **Skills** — name + a 0–100 level, shown as progress bars.
- **Education** — degree, school, period, and a short description.
- **Experience** — role, company, location, period, and highlights (one
  per line — each becomes a bullet point).
- **References** — name, position, phone, telegram.
- **Languages** — name + fluency percentage, shown as rings.
- **Hobbies** — a comma-separated list, shown as chips.

Use **+ Add …** to add another row to any section, and **Remove** to delete
one. Click **Save profile** to publish your changes — the public site
reflects them immediately on refresh.

## Adding your work

Log in at `/admin`, then use the **Add new piece** form:

- **Title / Category** — category becomes a filter tab on the public site
  automatically (e.g. "Branding", "Illustration", "Motion").
- **Type** — Image or Video.
- **Tags** — comma-separated, shown in the lightbox.
- **Media file** — JPG, PNG, GIF, WEBP, MP4, WEBM, or MOV, up to 50MB.

Uploaded files are stored in `public/uploads/` and referenced from
`data/portfolio.json`. Drag rows in the "Current work" list to change the
order they appear in on the site.

## Project structure

```
portfolio-site/
├── server.js                  # Express app: auth, API, file uploads
├── package.json
├── scripts/create-admin.js    # CLI to set admin username/password
├── data/portfolio.json        # portfolio items (auto-created)
├── data/profile.json          # resume/profile content (auto-created, pre-seeded)
├── public/
│   ├── index.html             # public gallery page
│   ├── css/style.css          # public site styles
│   ├── css/admin.css          # admin panel styles
│   ├── js/main.js             # gallery rendering + lightbox
│   ├── admin/index.html       # admin login
│   ├── admin/dashboard.html   # admin dashboard
│   ├── js/admin-login.js
│   ├── js/admin-dashboard.js
│   └── uploads/               # uploaded media (auto-created)
```

## Notes on security

- Passwords are hashed with bcrypt — never stored or compared in plain text.
- The dashboard is guarded both client-side (redirect if not logged in) and
  server-side (the `/admin/dashboard.html` route itself checks the session).
- All create/edit/delete/reorder API routes require an active admin session.
- Sessions last 8 hours by default; change `cookie.maxAge` in `server.js` if
  you'd like a different duration.
- For production use, put this behind HTTPS and set `cookie.secure = true`
  in the session config in `server.js`.

## Customizing the design

- Colors, fonts, and layout live in `public/css/style.css` as CSS custom
  properties at the top of the file (`--ink`, `--paper`, `--signal`, etc.) —
  change these to reskin the whole site.
- The homepage copy (name, tagline, hero text) is in `public/index.html`.
