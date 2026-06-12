# هورشید — Hoorshid QR Menu

Bilingual (Persian/English) fast-food QR-menu website with a multi-user admin panel and activity log.

Customers scan a QR code at the table and get a fast, mobile-first menu (RTL Persian by default, full LTR English mirror). The manager updates everything — prices, photos, discounts, availability — from the admin panel on any phone.

## Features

- **Customer menu** (`/`): splash screen with brand logo and working hours, sticky category tabs with scroll-spy, item cards with circular glowing photos, multi-size prices in Toman, discount badges (struck-through original + final price), out-of-stock items shown dimmed with a "موجود نیست" badge, footer with tap-to-call phone, address and embedded Google Map.
- **Photos**: up to 6 per item; the first is the card photo, tapping opens a full-screen swipeable gallery. Uploads are validated (images only, max 2MB) and resized server-side to 800px webp.
- **Admin panel** (`/admin`): username + password login, **manager / staff roles** — staff manage the menu; only managers manage users and see the **activity log** (who changed what, when, with old → new values for prices and settings).
- **Self-contained**: Node.js + Express + SQLite (single file), fonts bundled locally, no external cloud services — deployable on any local VPS and reliably reachable from inside Iran.

## Requirements

- Node.js 20+ (tested with Node 24)

## Quick start (development)

```bash
npm install                            # installs server + client workspaces
npm run seed                           # creates and seeds data/hoorshid.sqlite
npm run set-password -- mypassword     # creates the 'manager' user with this password
npm run dev                            # server on :4000 + client on :5173
```

Open `http://localhost:5173` for the customer menu and `http://localhost:5173/admin` for the admin panel (username `manager`).

## Scripts

| Command | What it does |
| ------- | ------------ |
| `npm run dev` | Runs Express (`:4000`, auto-restart) and Vite (`:5173`, proxies `/api` + `/uploads`) together |
| `npm run build` | Builds the production frontend into `client/dist` |
| `npm start` | Production server — Express serves the API **and** the built frontend on `:4000` (or `$PORT`) |
| `npm run seed` | Seeds the DB from `seed/menu.json` (skips if not empty; add `-- --force` to wipe and re-seed) |
| `npm run set-password -- [user] <pw>` | Sets a user's password (creates the user if missing; default user: `manager`) |

## Configuration (`.env`, auto-created on first run)

```ini
SESSION_SECRET=...   # random hex, generated automatically
PORT=4000            # optional
COOKIE_SECURE=false  # optional: required if serving production over plain HTTP
```

Users and passwords live in the database (bcrypt hashes), managed from the admin panel or via `npm run set-password`.

## API overview

| Endpoint | Auth | Description |
| -------- | ---- | ----------- |
| `GET /api/menu` | public | Visible categories + active items with computed discount prices, plus settings |
| `POST /api/login`, `POST /api/logout`, `GET /api/me` | — | Session via signed httpOnly cookie |
| `GET /api/admin/menu` | staff | Full menu including hidden/inactive items |
| `POST /api/items`, `PUT/DELETE /api/items/:id` | staff | Item CRUD (bilingual fields, size variants, photo list) |
| `PATCH /api/items/:id/toggle` | staff | Show/hide the item on the menu |
| `PATCH /api/items/:id/stock` | staff | `{stock: 0}` = out of stock (dimmed), `{stock: null}` = available |
| `PATCH /api/items/:id/discount` | staff | `{type:'percent'\|'fixed', value}` or `{type:null}` to remove |
| `POST /api/categories`, `PUT/DELETE /api/categories/:id`, `PATCH /api/categories/reorder` | staff | Category CRUD, show/hide, ordering |
| `PUT /api/settings` | staff | Address (FA/EN), phone, map location, working hours |
| `POST /api/upload` | staff | Image upload — items reference `images: [filenames]`, first = main |
| `GET/POST /api/users`, `PATCH /api/users/:id/password`, `DELETE /api/users/:id` | manager | User management |
| `GET /api/logs` | manager | Activity log (filter with `?user=`, `?limit=`) |

## Running with Docker

```bash
# 1. Make sure SESSION_SECRET exists (sessions survive restarts):
echo "SESSION_SECRET=$(openssl rand -hex 32)" > .env

# 2. Build and start (serves everything on port 4000):
docker compose up -d --build

# 3. First time only — seed the menu and create the manager user:
docker compose run --rm hoorshid node server/seed.js
docker compose run --rm hoorshid node server/scripts/set-password.js manager a-strong-password
```

The SQLite database and photos are bind-mounted from `./data` and `./uploads`, so they
persist across rebuilds — and if you copy those two folders from another machine, your
existing menu comes with them (skip the seed step). `COOKIE_SECURE=false` is set in
`docker-compose.yml` for plain-HTTP serving; remove it once you put HTTPS in front.

## Deploying on a Linux VPS

```bash
# 1. Install Node.js 20+ and pm2
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm i -g pm2

# 2. Copy the project to the server — INCLUDING data/ and uploads/
#    (they contain the real menu and photos), excluding node_modules.
cd /opt/hoorshid
npm install
npm run build
npm run set-password -- a-strong-password

# 3. Run with pm2 (config in deploy/ecosystem.config.cjs)
pm2 start deploy/ecosystem.config.cjs
pm2 save && pm2 startup   # start on boot
```

The app now serves everything (frontend + API + uploads) on port 4000.

### nginx in front (recommended)

Copy `deploy/nginx.conf.example` to `/etc/nginx/sites-available/hoorshid`, adjust `server_name`, then:

```bash
sudo ln -s /etc/nginx/sites-available/hoorshid /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

If you serve over plain HTTP (no TLS certificate), add `COOKIE_SECURE=false` to `.env`, otherwise the admin login cookie will not be stored by the browser.

### Quick public test without a server

`run-hoorshid.cmd` (Windows) starts the local server plus a free Cloudflare quick tunnel and prints a public `https://....trycloudflare.com` URL — handy for testing with real phones before deploying. The URL changes on every restart.

### Backups

Everything lives in two places: `data/hoorshid.sqlite` (menu, users, log) and `uploads/` (photos). Copy those two and you have a full backup.

## Project layout

```text
client/          React + Vite frontend (customer menu + admin panel)
server/          Express API, SQLite access, auth, uploads, activity log
seed/menu.json   Seed data exported from the live menu (FA/EN, prices in Toman)
data/            SQLite database (created on first run)
uploads/         Uploaded item photos (webp, max 800px) + brand source images
deploy/          pm2 + nginx examples
```
