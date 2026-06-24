# LinkUp

LinkUp is a fullstack realtime chat and video-calling monorepo.

## Stack
- Client: React + Vite + TypeScript + TailwindCSS + Radix/shadcn-style UI + React Router + TanStack Query
- Server: Node.js + Express + TypeScript + MongoDB + Mongoose + Zod
- Realtime: Socket.IO for chat + call signaling
- Calls: WebRTC mesh, STUN default and TURN env placeholders

## Monorepo Structure
- `apps/server` - REST API, auth, socket server, Mongo models
- `apps/client` - SPA chat/call app

## Prerequisites
- Node.js 20+
- npm 10+
- MongoDB running locally or a hosted connection string

## Environment Setup
1. Copy env templates:
   - `apps/server/.env.example` to `apps/server/.env`
   - `apps/client/.env.example` to `apps/client/.env`
2. Update values (Mongo URI, JWT secrets, client URL, TURN credentials if used).

## Install
```bash
npm install
```

## Clear Database (Clean State)
```bash
npm run db:clear
```

## Run Dev (Server + Client)
```bash
npm run dev
```
- API: `http://localhost:5000`
- Client: `http://localhost:5173`

## Mobile Testing (LAN)
1. Find your laptop LAN IPv4:
```bash
ipconfig
```
2. Set these values:
- `apps/server/.env`
  - `CLIENT_ORIGIN=http://<LAN_IP>:5173`
- `apps/client/.env`
  - `VITE_API_URL=http://<LAN_IP>:5000/api/v1`
  - `VITE_SOCKET_URL=http://<LAN_IP>:5000`
3. Restart dev server:
```bash
npm run dev
```
4. Open on phone (same Wi-Fi):
- `http://<LAN_IP>:5173`

## Public Port Forward (Internet) via Cloudflare Tunnel
1. Install `cloudflared`.
2. Start API tunnel:
```bash
cloudflared tunnel --url http://localhost:5000
```
3. Start client tunnel:
```bash
cloudflared tunnel --url http://localhost:5173
```
4. Use generated `https://*.trycloudflare.com` URLs:
- Set `CLIENT_ORIGIN` to client tunnel URL
- Set `VITE_API_URL` and `VITE_SOCKET_URL` to API tunnel URL

Note: For reliable video calls across networks, configure TURN (`TURN_URL`, `TURN_USERNAME`, `TURN_CREDENTIAL`) on server and client env files.

## Build
```bash
npm run build
```

## API Prefix
All endpoints are under `/api/v1`.

## Socket Rooms
- `user:<userId>`
- `conversation:<conversationId>`
- `call:<callId>`
