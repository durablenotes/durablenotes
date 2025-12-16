# DurableNotes

A modern, privacy-focused note-taking application built with **React 19**, **Cloudflare Workers**, and **Durable Objects**. Designed for "alive" thoughts that naturally decay over time to keep your mind cluttered-free.

![DurableNotes Banner](./public/vite.svg)

## ✨ key Features

- **Alive Thoughts**: Notes have a lifecycle (Alive -> Warming -> Cooling -> Archived) based on activity.
- **Micro-Journaling**: Focused on capturing quick thoughts, plans, and ideas.
- **Spaces**: Organize thoughts into different contexts (Stream, Work, Ideas, Personal).
- **Rich Text**: Full-featured editor powered by TipTap.
- **Edge Deployment**: Runs globally on Cloudflare's edge network for low latency.
- **Admin Dashboard**: Built-in user management and branding controls.

## 🛠 Tech Stack

- **Frontend**: React 19, TypeScript, Vite, TailwindCSS
- **Backend**: Cloudflare Workers, Hono-style routing (custom), D1 Database
- **Storage**: Durable Objects (for consistent user state), D1 (for relational data)
- **Auth**: Google OAuth 2.0 with JWT

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Cloudflare Wrangler CLI (`npm install -g wrangler`)
- Google Cloud Console Project (for OAuth)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/durablenotes.git
   cd durablenotes
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment**
   - Copy `.env.example` to `.env`
   - Add your Google OAuth Client ID to `.env`
   - Ensure `admin.ts` and `auth.ts` logic matches your improved env variable setup if modifying backend.

4. **Run Development Server**
   ```bash
   npm run dev
   ```
   *Frontend: http://localhost:5173 | Backend: http://localhost:8787*

## 📦 Deployment

This project handles both frontend (SPA) and backend (Workers) in a single deployment flow using **Cloudflare Assets**.

1. **Build the project**
   ```bash
   npm run build
   ```

2. **Deploy to Cloudflare**
   ```bash
   npx wrangler deploy
   ```

## 🏗 Architecture

- **`src/frontend`**: React Single Page Application (SPA).
  - Uses `useNotes` hook for optimistic UI updates.
  - Authentication state managed via Context API.
- **`src/backend`**: Cloudflare Worker.
  - `NoteStore.ts`: Durable Object managing user notes state.
  - `/api/admin`: Admin routes secured by email allowlist.

## 🔐 Security Note

- All API routes are protected via JWT verification against Google's public keys.
- Admin routes are restricted to emails defined in the `ADMIN_EMAILS` environment variable.
- Durable Objects ensure data isolation per user.

## 📄 License

MIT
