# FundFrog — Crowdfunding for Changemakers

A crowdfunding platform where supporters fund campaigns they believe in and creators bring their ideas to life.

## Tech Stack

| Layer | Stack |
|-------|-------|
| Frontend | Next.js 16, React 19, Tailwind CSS 4, TypeScript |
| Backend | Express 5 (CommonJS), MongoDB driver v7 |
| Auth | JWT (httpOnly cookie), Google OAuth |
| Payments | Stripe Checkout (via Next.js Route Handlers) |
| Testing | Vitest, @testing-library/react, jsdom |

## Prerequisites

- Node.js 22+
- npm 10+
- MongoDB Atlas URI (or local MongoDB)
- Stripe account (test mode)
- Google OAuth Client ID

## Setup

### 1. Clone and install

```bash
# Client
cd client
npm install

# Server
cd ../server
npm install
```

### 2. Environment variables

Copy `.env.example` to the appropriate locations:

**Server (`server/.env`)**

| Variable | Description |
|----------|-------------|
| `PORT` | Server port (default 9000) |
| `MONGOBD_URI` | MongoDB connection string (note: missing `N` in `MONGOBD`) |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `INTERNAL_API_KEY` | Shared secret for server-to-server calls |

**Client (`client/.env`)**

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_GOOGLE_CLIENT_ID` | Google OAuth client ID |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key |
| `STRIPE_SECRET_KEY` | Stripe secret key |
| `JWT_SECRET` | Must match the server's value |
| `INTERNAL_API_KEY` | Must match the server's value |

### 3. Run

```bash
# Terminal 1 — Server (port 9000)
cd server
npm run dev

# Terminal 2 — Client (port 3000)
cd client
npm run dev
```

The client proxies `/api/*` to `http://localhost:9000/api/*` via Next.js rewrites.

## Available Commands

### Client (`client/`)

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server (port 3000) |
| `npm run build` | Production build |
| `npm start` | Production server |
| `npm run lint` | ESLint |
| `npm test` | Vitest run |
| `npx tsc --noEmit` | TypeScript typecheck |

### Server (`server/`)

| Command | Description |
|---------|-------------|
| `npm start` | `node index.js` |
| `npm run dev` | `nodemon index.js` (requires global `nodemon`) |
| `npm test` | Vitest run |

## Architecture

- **Two independent repos** — `client/` and `server/` each have their own `.git`, `package.json`, and dependencies.
- **Auth**: httpOnly cookie only. No localStorage tokens. Session restored on mount via `GET /api/auth/me`.
- **Roles**: `supporter`, `creator`, `admin`. Enforced via `requireRole()` middleware on the server.
- **Payments**: Stripe Checkout Sessions created via Next.js Route Handlers (not Express). Server has an internal-only `/api/payments/verify` endpoint gated by `x-internal-key`.
- **Credit system**: 10 credits = $1 purchase. 20 credits = $1 withdrawal. Minimum withdrawal: 200 credits.

## Database

MongoDB database: `fundfrog`. Collections: `users`, `campaigns`, `contributions`, `reports`, `withdrawals`, `payments`, `notifications`.

## Admin Access

Create an admin user directly in MongoDB:

```javascript
db.users.insertOne({
  name: "Admin",
  email: "admin@fundfrog.com",
  password: "<bcrypt-hashed-password>",
  role: "admin",
  credits: 0,
  createdAt: new Date()
})
```

## Testing

```bash
# Client tests
cd client && npm test

# Server tests
cd server && npm test
```

Server tests follow a spec-driven pattern — each test file creates an in-memory Express app duplicating the route logic and mocks MongoDB collections. No real database needed.
