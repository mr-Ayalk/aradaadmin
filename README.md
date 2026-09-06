# Arada HQ website

Next.js + Neon Postgres. Deploy this folder to Vercel.

## Vercel

1. Root Directory: `hq-web`
2. Environment variables:
   - `DATABASE_URL` = your Neon pooled connection string
   - `NEXT_PUBLIC_HQ_URL` = `https://your-app.vercel.app`
3. Deploy, then put that URL in `desktop/build/hq-config.js` and rebuild the desktop app.

Do not commit `.env`.
# aradaadmin
