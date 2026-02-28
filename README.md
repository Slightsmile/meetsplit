# MeetSplit

**Friends meet. Bills split.** — Find a date that works for everyone and split trip expenses without the headache.

No signup required. Fully anonymous, device-based sessions.

## Features

- **Meet** — Calendar-based availability picker. See at a glance which dates work for everyone.
- **Split** — Add expenses (equal or manual split), track payments, and see who owes whom.
- **Event Mode** — Admin can lock the room to show only final date and announcements.
- **Session Recovery** — Lost your session? Re-enter your name + room code to get back in.
- **Auto-Cleanup** — Rooms and anonymous users older than 30 days are automatically deleted.

## Tech Stack

| Layer       | Technology                           |
| ----------- | ------------------------------------ |
| Framework   | Next.js 14 (App Router)              |
| Language    | TypeScript                           |
| Styling     | Tailwind CSS                         |
| Backend     | Firebase (Auth, Firestore)           |
| Cleanup     | Firebase Cloud Functions (scheduled) |
| Hosting     | Vercel (recommended)                 |
| Testing     | Vitest                               |

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- A Firebase project with Firestore and Anonymous Auth enabled

### 1. Clone & Install

```bash
git clone https://github.com/<your-username>/meetsplit.git
cd meetsplit
npm install
```

### 2. Firebase Setup

1. Create a project at [console.firebase.google.com](https://console.firebase.google.com)
2. Enable **Authentication → Anonymous** sign-in
3. Create a **Firestore Database** (start in production mode)
4. Copy your web app config from **Project Settings → General → Your apps**

### 3. Environment Variables

```bash
cp .env.example .env.local
```

Fill in your Firebase config values in `.env.local`:

```
NEXT_PUBLIC_FIREBASE_API_KEY=...
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=...
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
NEXT_PUBLIC_FIREBASE_APP_ID=...
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Deploy Firestore Rules

```bash
firebase login
firebase use --add   # select your project
npm run deploy:rules
```

### 5. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Deployment

### Frontend (Vercel)

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Add environment variables in Vercel dashboard (same as `.env.local`)
4. Deploy — Vercel auto-detects Next.js

### Cloud Functions (Auto-Cleanup)

```bash
cd firebase/functions && npm install && cd ../..
npm run deploy:functions
```

This deploys a scheduled function that runs daily at 2:00 AM UTC and deletes:
- Rooms (and all associated data) older than 30 days
- Anonymous Firebase Auth users older than 30 days

### Firestore Security Rules

```bash
npm run deploy:rules
```

## Database Reset

To wipe all data and users for a fresh start:

1. Place your Firebase service account key at `scripts/serviceAccountKey.json`
   (download from Firebase Console → Project Settings → Service Accounts)
2. Run:

```bash
npm run db:clear
```

## Project Structure

```
app/                  # Next.js App Router pages
  page.tsx            # Home — create/join room
  faq/page.tsx        # FAQ page
  join/[roomId]/      # Join-by-link page
  r/[roomId]/         # Room layout + tabs
    page.tsx           # Overview tab
    availability/      # Meet tab
    split/             # Split tab
    summary/           # Summary page
components/           # React components
  room/               # Room-specific components
  ui/                 # Shared UI primitives
lib/
  firebase/           # Firebase config & Firestore helpers
  hooks/              # React hooks (auth, room data)
  utils/              # Utility functions (calculations, formatting)
firebase/
  functions/          # Cloud Functions for auto-cleanup
scripts/              # One-time admin scripts
types/                # TypeScript type definitions
```

## Scripts

| Command               | Description                                 |
| --------------------- | ------------------------------------------- |
| `npm run dev`         | Start development server                    |
| `npm run build`       | Build for production                        |
| `npm run start`       | Start production server                     |
| `npm run lint`        | Run ESLint                                  |
| `npm run test`        | Run Vitest tests                            |
| `npm run deploy:functions` | Deploy Cloud Functions                 |
| `npm run deploy:rules`    | Deploy Firestore security rules         |
| `npm run db:clear`        | Wipe all Firestore data and Auth users  |

## License

MIT

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js/) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/deployment) for more details.
