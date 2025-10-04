# Webhook Dashboard

A Next.js application for managing webhooks with authentication and request history.

## Features

- Secure webhook endpoint that accepts GET and POST requests
- API secret key validation (UUID: `123e4567-e89b-12d3-a456-426614174000`)
- Admin login with fixed credentials (username: `admin`, password: `admin123`)
- Dashboard to view endpoints and request history
- Delete individual requests from history

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Set up the database:
   ```bash
   .\setup-db.bat
   ```

3. Seed the admin user:
   ```bash
   npx tsx scripts/seed.ts
   ```

4. Start the development server:
   ```bash
   npm run dev
   ```

5. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

1. Log in with username `admin` and password `admin123`.
2. The dashboard will show endpoints that have received webhooks.
3. Click on an endpoint to view its request history.
4. Use the delete button to remove requests.

## Webhook Endpoint

Send requests to `/api/webhook` with the header `x-webhook-secret: 123e4567-e89b-12d3-a456-426614174000`.

Example:
```bash
curl -X POST http://localhost:3000/api/webhook \
  -H "x-webhook-secret: 123e4567-e89b-12d3-a456-426614174000" \
  -d '{"key": "value"}'
```

Without the secret, it returns 403 Forbidden.
