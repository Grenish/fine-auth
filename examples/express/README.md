# fine-auth Express Example

A simple Express.js example demonstrating fine-auth for authentication.

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database

## Setup

1. Install dependencies:

```bash
npm install express pg fine-auth cookie-parser
# or
bun add express pg fine-auth cookie-parser
```

2. Set up your environment variables:

```bash
# .env
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
SECRET=your-super-secret-key-at-least-32-characters
PORT=3000
```

3. Run the example:

```bash
npm run start
# or
bun run index.ts
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/auth/signup` | Create a new user |
| POST | `/auth/signin` | Sign in with email/password |
| POST | `/auth/signout` | Sign out (invalidate session) |
| GET | `/auth/me` | Get current user (protected) |

## Example Requests

### Sign Up

```bash
curl -X POST http://localhost:3000/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Sign In

```bash
curl -X POST http://localhost:3000/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Get Current User

```bash
curl http://localhost:3000/auth/me \
  -H "Cookie: session=<session-id>"
```

### Sign Out

```bash
curl -X POST http://localhost:3000/auth/signout \
  -H "Cookie: session=<session-id>"
```

## File Structure

```
express/
├── index.ts      # Main Express app
├── db.ts         # Database setup
├── auth.ts       # FineAuth setup
└── README.md     # This file
```
