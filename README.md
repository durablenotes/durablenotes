# Durable Notes

A distraction-free note-taking app with "durable" storage that mimics the permanence of thoughts while allowing them to decay naturally over time. Built on Cloudflare Workers and D1.

## Key Features

### 🧠 Intelligent Decay
Notes have a lifecycle:
- **Alive**: Fresh thoughts (< 1 hour)
- **Warming**: Recent context (< 24 hours)
- **Cooling**: Fading into background (> 24 hours)

### ✨ Rich Composer
- **Expanded Mode**: Press `Shift+Enter` to open a full rich-text editor.
- **Formatting**: Supports **Bold**, *Italic*, and Lists.
- **Instant Save**: Notes are saved optimistically for a zero-latency experience.

### 🎨 Admin Branding
- **Customizable**: Admins can set the Site Title, Logo, and Favicon directly from the dashboard.
- **Dynamic**: Changes are applied globally in real-time.

### ⚡ Technical Stack
- **Frontend**: React, Vite, Tailwind CSS, Framer Motion
- **Backend**: Cloudflare Workers, Durable Objects, D1 Database
- **Auth**: Google OAuth 2.0 with JWT
