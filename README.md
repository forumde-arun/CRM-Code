# FlowWA - WhatsApp CRM prototype

## Run
    cd backend  && cp .env.example .env && npm install && npm run dev
    cd frontend && cp .env.example .env && npm install && npm run dev
Open http://localhost:5173. Needs Node 18+ and MongoDB.

## Keys (backend/.env, frontend/.env)
- MONGO_URI, JWT_SECRET, ENCRYPTION_KEY (64 hex chars, command is in .env.example)
- META_APP_ID, META_APP_SECRET: Meta app > Settings > Basic
- VITE_META_APP_ID (same app ID) and VITE_META_CONFIG_ID: the Embedded Signup configuration ID (Facebook Login for Business)
- WEBHOOK_VERIFY_TOKEN: any string you choose

## Meta setup
1. Webhook: callback URL https://YOUR-HTTPS-DOMAIN/webhook with your verify token; subscribe to "messages". (Use ngrok locally.)
2. Add your frontend domain to the app's allowed domains / JS SDK domains.
3. Live mode needs business verification + App Review. Until then use "Developer connect" on the Connection page with a System User token.

## Flow
Register > Connection (Connect WhatsApp) > Templates (approved only) > Contacts (opted-in) > Campaigns.
Backend: MVC in backend/src (routes, controllers, models, services). Tokens are AES-256-GCM encrypted per user.
