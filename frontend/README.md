# CRM frontend (Next.js + Tailwind)

    npm install
    npm run dev        # http://localhost:5173 (same port as before)

- Keys are in `.env.local` (copy `.env.example`). `NEXT_PUBLIC_*` replace the old `VITE_*` keys.
- `BACKEND_URL` is where the Express API runs. Requests to `/api/*` are forwarded there (replaces the Vite proxy).
- Set `NEXT_PUBLIC_SITE_URL` to your real https domain in production (used for SEO: canonical, sitemap, robots, Open Graph).
- After changing any `.env.local` value, stop and restart `npm run dev`.
- Production: `npm run build` then `npm start`.
