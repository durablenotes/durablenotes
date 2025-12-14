# Golden Cloudflare Template (Vite + React + TS)

This is the **Standard Base Template** for all future [wasiq.co] applications.

## 🛠 Tech Stack
- **Frontend**: React 19, TypeScript, Vite
- **Styling**: TailwindCSS v3 (Stable), Autoprefixer
- **Backend**: Cloudflare Pages Functions (`/functions`)
- **Deployment**: Cloudflare Workers/Pages (via `wrangler`)

## 🚀 How to Use (For New Projects)
1. **Clone & Rename**:
   - Copy this entire directory.
   - Rename the folder to your new project name.
   - Update `package.json` name.
   - Update `wrangler.jsonc` name.
2. **Install**:
   ```bash
   npm install
   ```
3. **Develop**:
   ```bash
   npm run dev
   ```

## 📦 Deployment (Professional Setup)
We use the **Workers Assets** mode for clean, repeatable deployments.

1. **Build**:
   ```bash
   npm run build
   ```
   *Creates the `dist` folder.*

2. **Deploy**:
   ```bash
   npx wrangler deploy
   ```
   *Uploads `dist` and `functions` to Cloudflare using `wrangler.jsonc` configuration.*

## 🤖 AI Agent Context
**READ THIS CAREFULLY IF YOU ARE AN AI:**
- **Base Structure**: Do NOT change the core Vite/Tailwind setup unless explicitly asked.
- **Styling**: The default theme is **Black (`bg-black`)** with white text. Maintain this aesthetic `index.css`.
- **Routing**: This is a SPA. If adding client-side routing (React Router), ensure `_redirects` or worker routing handles `/* -> /index.html`.
- **Deployment**: ALWAYS use `npm run build` followed by `npx wrangler deploy`. Do not use the dashboard for dragging/dropping.
