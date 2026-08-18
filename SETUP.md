# Madd Lines (`madd.lines`)

Madison’s tattoo portfolio + booking site. Forked from `Nick Website/artist-portfolio-store`.

**Path:** `WIP/madisons website/madd.lines`

## Run locally

```bash
cd "/Users/michael/Desktop/project /WIP/madisons website/madd.lines"
cp .env.example .env   # fill MongoDB, Clerk, R2, etc.
npm install
npm run dev:all        # API :3000 + Vite :5173
```

Admin: http://localhost:5173/admin/login

## Fork again from Nick’s store (reference)

From the `WIP` folder:

```bash
cd "/Users/michael/Desktop/project /WIP"

mkdir -p "madisons website"

rsync -a \
  --exclude 'node_modules' \
  --exclude '.git' \
  --exclude 'frontend/dist' \
  --exclude '.env' \
  --exclude '.cursor' \
  "Nick Website/artist-portfolio-store/" \
  "madisons website/madd.lines/"
```

Then re-apply Madd Lines tattoo customizations (or keep this repo as the source of truth).

## Defaults

- Site name: **Madd Lines**
- Nav: **Portfolio** (route `/gallery`)
- Cart: hidden (`VITE_STOREFRONT_SHOW_CART=false`)
- MongoDB: `DB_NAME=madd_lines`

Use **new** MongoDB, R2, Clerk, and Stripe credentials — not Nick’s production keys.
