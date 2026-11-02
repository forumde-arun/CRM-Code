# FlowWA – WhatsApp CRM

FlowWA is a WhatsApp CRM prototype that enables users to connect their WhatsApp Business accounts, manage contacts, use approved message templates, and run messaging campaigns through the Meta WhatsApp Cloud API.

---

## 🚀 Tech Stack

| Technology | Purpose |
|---|---|
| React + Vite | Frontend |
| Node.js + Express.js | Backend |
| MongoDB | Database |
| JWT | Authentication |
| Meta WhatsApp Cloud API | WhatsApp integration |
| AES-256-GCM | WhatsApp token encryption |

---

## 📋 Prerequisites

Before running the project, install:

- [Node.js](https://nodejs.org/) (version 18 or higher)
- npm (comes with Node.js)
- [Git](https://git-scm.com/)
- [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas) account or local MongoDB
- [Meta for Developers](https://developers.facebook.com/) account for WhatsApp integration

Verify your installations:

```bash
node -v
npm -v
git --version
```

---

## 📥 1. Clone the Repository

Open your terminal and run:

```bash
git clone https://github.com/forumde-arun/CRM-Code.git
```

Navigate to the project directory:

```bash
cd CRM-Code
```

### Project Structure

```text
CRM-Code/
│
├── backend/
│   ├── src/
│   │   ├── config/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── models/
│   │   ├── routes/
│   │   └── services/
│   ├── .env.example
│   └── package.json
│
├── frontend/
│   ├── src/
│   ├── .env.example
│   └── package.json
│
├── .gitignore
└── README.md
```

---

## ⚙️ 2. Backend Setup

Open a terminal in the project root.

Navigate to the backend:

```bash
cd backend
```

Create your environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

### Configure Backend Environment Variables

Open `backend/.env` and configure:

```env
PORT=5000

MONGO_URI=your_mongodb_connection_string

JWT_SECRET=your_jwt_secret

ENCRYPTION_KEY=your_64_character_hex_key

META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret

WEBHOOK_VERIFY_TOKEN=your_custom_verification_token
```

### Environment Variables Explained

| Variable | Description |
|---|---|
| `PORT` | Backend server port |
| `MONGO_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret used for JWT authentication |
| `ENCRYPTION_KEY` | 32-byte encryption key represented as 64 hexadecimal characters |
| `META_APP_ID` | Meta application ID |
| `META_APP_SECRET` | Meta application secret |
| `WEBHOOK_VERIFY_TOKEN` | Custom token used for webhook verification |

### MongoDB Configuration

1. Create an account on [MongoDB Atlas](https://www.mongodb.com/products/platform/atlas).
2. Create a database cluster.
3. Create a database user.
4. Configure Network Access to allow your development IP.
5. Copy your MongoDB connection string.
6. Add it to `MONGO_URI` in `backend/.env`.

### Generate Encryption Key

The encryption key must contain exactly 64 hexadecimal characters.

Use the key-generation command provided in `backend/.env.example`.

**Important:** FlowWA uses AES-256-GCM encryption to store WhatsApp access tokens. Keep your encryption key safe. Changing it without migrating existing encrypted data can make previously stored tokens unreadable.

---

## 🎨 3. Frontend Setup

Open a second terminal from the project root.

Navigate to the frontend:

```bash
cd frontend
```

Create your environment file:

**Windows PowerShell:**

```powershell
Copy-Item .env.example .env
```

**Linux / macOS:**

```bash
cp .env.example .env
```

Install dependencies:

```bash
npm install
```

### Configure Frontend Environment Variables

Open `frontend/.env`:

```env
VITE_META_APP_ID=your_meta_app_id
VITE_META_CONFIG_ID=your_embedded_signup_config_id
```

| Variable | Description |
|---|---|
| `VITE_META_APP_ID` | Meta application ID used by the frontend |
| `VITE_META_CONFIG_ID` | Embedded Signup configuration ID |

**Note:** `VITE_META_APP_ID` must match the backend's `META_APP_ID`.

The configuration ID is obtained from the Facebook Login for Business / Embedded Signup configuration in your Meta application.

> ⚠️ Never put private credentials, access tokens, app secrets, or encryption keys in frontend environment variables. Vite exposes `VITE_` variables to the browser.

---

## 🔑 4. Meta Developer App Configuration

WhatsApp integration requires a Meta Developer application.

### Step 1: Create a Meta Application

1. Visit [Meta for Developers](https://developers.facebook.com/).
2. Log in using your Facebook account.
3. Create a new application.
4. Add the WhatsApp product.
5. Navigate to **App Settings → Basic**.
6. Copy the App ID and App Secret.

Configure the backend:

```env
META_APP_ID=your_meta_app_id
META_APP_SECRET=your_meta_app_secret
```

Configure the frontend:

```env
VITE_META_APP_ID=your_meta_app_id
```

### Step 2: Configure Embedded Signup

1. Open your Meta application.
2. Configure Facebook Login for Business.
3. Create an Embedded Signup configuration.
4. Copy the configuration ID.
5. Add it to `frontend/.env`:

```env
VITE_META_CONFIG_ID=your_embedded_signup_config_id
```

### Step 3: Configure Allowed Domains

Add your frontend domain to the relevant Meta application settings, including allowed domains and JavaScript SDK domains where required.

For local development, configure the appropriate local development domain and port.

### Step 4: Configure WhatsApp Webhooks

Meta requires a publicly accessible HTTPS callback URL.

Configure your webhook callback URL:

```text
https://YOUR-HTTPS-DOMAIN/webhook
```

Set the same verification token in your backend environment and Meta webhook configuration:

```env
WEBHOOK_VERIFY_TOKEN=your_custom_verification_token
```

Subscribe to the WhatsApp `messages` webhook field.

**Local Webhook Testing**

For local development, you can use [ngrok](https://ngrok.com/) to expose your backend through HTTPS.

```bash
ngrok http 5000
```

Use the HTTPS forwarding URL generated by ngrok when configuring your Meta webhook.

Make sure the callback path matches the actual webhook route implemented in the backend.

### Step 5: Production Access

For production WhatsApp onboarding and messaging, your Meta application may require:

- Meta Business verification
- App Review and the required permissions
- Appropriate WhatsApp Business Account configuration

Until the full production requirements are satisfied, the application also supports **Developer Connect** on the Connection page using a suitable System User access token.

Never commit System User tokens or other private credentials to GitHub.

---

## ▶️ 5. Run the Project Locally

You must run the backend and frontend in two separate terminals.

### Terminal 1 – Start Backend

```bash
cd backend
npm run dev
```

The backend should start on the configured port, normally:

```text
http://localhost:5000
```

### Terminal 2 – Start Frontend

```bash
cd frontend
npm run dev
```

The frontend should be available at:

```text
http://localhost:5173
```

### Open the Application

**[http://localhost:5173](http://localhost:5173)**

---

## 🔄 6. Application Workflow

The typical application workflow is:

1. **Register / Login** – Create an account and authenticate.
2. **Connection** – Connect your WhatsApp Business account using Connect WhatsApp or Developer Connect.
3. **Templates** – View and use approved WhatsApp message templates.
4. **Contacts** – Manage contacts who have opted in to receive messages.
5. **Campaigns** – Create and manage messaging campaigns.

Only send messages to recipients who have provided the required consent. Follow Meta's messaging policies and applicable laws.

---

## 🏗️ 7. Backend Architecture

The backend follows the MVC architecture.

| Directory | Responsibility |
|---|---|
| `config/` | Database and application configuration |
| `controllers/` | Handle incoming requests and responses |
| `middleware/` | Authentication and request processing |
| `models/` | MongoDB database models |
| `routes/` | API endpoint definitions |
| `services/` | Business logic and external integrations |

WhatsApp access tokens are encrypted per user using AES-256-GCM before being stored.

---

## 🔐 8. Security Guidelines

Every developer must configure their own local environment.

- Never commit `.env` files.
- Never share MongoDB credentials.
- Never expose JWT secrets or encryption keys.
- Never commit Meta App Secrets or WhatsApp access tokens.
- Use `.env.example` as the configuration template.
- Keep production secrets in a secure secret manager.
- Never place backend secrets in frontend environment variables.
- Do not commit `node_modules`.

The repository uses `.gitignore` to exclude private environment files.

### Developer Environment

Each developer should:

1. Clone the repository.
2. Create their own `.env` files.
3. Configure their own credentials.
4. Install project dependencies.
5. Start the backend and frontend.

The repository does not contain production credentials.

---

## 🛠️ 9. Troubleshooting

| Issue | Possible Solution |
|---|---|
| MongoDB connection failed | Verify `MONGO_URI`, database credentials and IP access |
| JWT authentication error | Check `JWT_SECRET` |
| Encryption error | Ensure `ENCRYPTION_KEY` contains 64 hexadecimal characters |
| Meta login not working | Verify App ID and Embedded Signup configuration ID |
| Webhook verification failed | Check callback URL and verification token |
| Webhook not receiving messages | Verify HTTPS accessibility and webhook subscriptions |
| Frontend cannot connect to backend | Check API URL configuration and backend port |
| Missing environment variables | Verify that both `.env` files exist and are configured |

Restart the corresponding development server after modifying environment variables.

---

## 👨‍💻 10. Contributing

Contributions and improvements are welcome.

1. Fork or clone the repository.
2. Create a separate feature branch.
3. Configure your local environment.
4. Install dependencies.
5. Implement your changes.
6. Test the application.
7. Submit a pull request.

Example:

```bash
git checkout -b feature/your-feature-name
git add .
git commit -m "Add: your feature description"
git push origin feature/your-feature-name
```

---

## 📌 Project Information

**Project:** FlowWA – WhatsApp CRM

**Repository:** [CRM-Code](https://github.com/forumde-arun/CRM-Code)

**Frontend:** React + Vite

**Backend:** Node.js + Express.js

**Database:** MongoDB

**Integration:** Meta WhatsApp Cloud API

---

*FlowWA – Simplifying WhatsApp Business Communication.*
