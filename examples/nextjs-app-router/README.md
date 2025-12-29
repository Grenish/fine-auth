# fine-auth Next.js App Router Example

A simple Next.js App Router example demonstrating fine-auth for authentication.

## Prerequisites

- Node.js 18+ or Bun
- PostgreSQL database

## Setup

1. Install dependencies:

```bash
npm install pg fine-auth
# or
bun add pg fine-auth
```

2. Set up your environment variables:

```bash
# .env.local
DATABASE_URL=postgresql://user:password@localhost:5432/mydb
SECRET=your-super-secret-key-at-least-32-characters
```

3. Run migrations (in your app initialization):

```typescript
import { db } from "@/lib/db";

// Run once on startup
await db.migrate();
```

4. Run the development server:

```bash
npm run dev
# or
bun dev
```

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/signup` | Create a new user |
| POST | `/api/auth/signin` | Sign in with email/password |
| POST | `/api/auth/signout` | Sign out (invalidate session) |
| GET | `/api/auth/me` | Get current user (protected) |

## File Structure

```
nextjs-app-router/
├── app/
│   └── api/
│       └── auth/
│           ├── signup/
│           │   └── route.ts    # POST /api/auth/signup
│           ├── signin/
│           │   └── route.ts    # POST /api/auth/signin
│           ├── signout/
│           │   └── route.ts    # POST /api/auth/signout
│           └── me/
│               └── route.ts    # GET /api/auth/me
├── lib/
│   ├── auth.ts                 # FineAuth setup
│   ├── db.ts                   # Database setup
│   └── session.ts              # Session helpers
└── README.md
```

## Usage in Server Components

```tsx
// app/dashboard/page.tsx
import { getCurrentUser } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div>
      <h1>Welcome, {user.email}!</h1>
    </div>
  );
}
```

## Usage in Route Handlers

```typescript
// app/api/protected/route.ts
import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  return NextResponse.json({
    message: "You have access!",
    user: session.user,
  });
}
```

## Example Requests

### Sign Up

```bash
curl -X POST http://localhost:3000/api/auth/signup \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Sign In

```bash
curl -X POST http://localhost:3000/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com", "password": "password123"}'
```

### Get Current User

```bash
curl http://localhost:3000/api/auth/me \
  -H "Cookie: session=<session-id>"
```

### Sign Out

```bash
curl -X POST http://localhost:3000/api/auth/signout \
  -H "Cookie: session=<session-id>"
```

## Session Helpers

The `lib/session.ts` file provides convenient helpers:

```typescript
import { getSession, getCurrentUser, isAuthenticated } from "@/lib/session";

// Get full session (user + session data)
const session = await getSession();

// Get just the user
const user = await getCurrentUser();

// Check if authenticated
const authed = await isAuthenticated();
```
