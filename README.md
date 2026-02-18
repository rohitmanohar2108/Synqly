# Synqly

Lightweight WebRTC + Socket.io demo for peer-to-peer video/audio rooms.

## Features
- Join a room by providing an email and room ID
- Real-time signalling via Socket.io
- Peer-to-peer media (WebRTC) between participants
- Simple React front-end and Node.js signalling server

## Tech stack
- Frontend: React (Create React App), React Router
- Realtime: socket.io (client + server)
- P2P media: WebRTC (getUserMedia, RTCPeerConnection)
- Backend: Node.js + socket.io
- Bundler / dev server: CRA webpack dev server

## Prerequisites
- Node.js (16+) and npm

## Quick start (development)
1. Clone the repository:

```bash
git clone https://github.com/rohitmanohar2108/Synqly.git
cd Synqly
```

2. Install dependencies for server and client (from repo root):

```bash
# Server
cd server
npm install

# In another shell: client
cd ../client
npm install
```

3. Start the signalling server (default port 8000):

```bash
cd server
npm run start
```

4. Start the React dev server (client):

```bash
cd client
npm start
```

The client dev server will print a local URL (e.g. http://localhost:3000 or http://localhost:3002). Open it in your browser.

## Usage
- From the lobby enter an email and a room ID (same room ID for other peers). The app will connect to the signalling server, create/exchange offers/answers, and establish a P2P media connection.

## Configuration & Notes
- Signalling server listens on port `8000` in `server/index.js`.
- The client expects the signalling server at `http://localhost:8000` (configured in `client/src/context/SocketProvider.jsx`).
- The `peer` service handles creating RTCPeerConnection objects and SDP offers/answers.

## Troubleshooting
- If you see "Unable to connect to server" in the lobby, ensure the server is running on port 8000 and reachable from the client host.
- Camera/mic permission required for media. Check browser permissions and console logs for errors.
- If the dev server runs on a nonstandard port, open the URL printed by `npm start`.

## Development tips
- To test with multiple participants, open the client in multiple browser windows or on separate devices on the same network and join the same room ID.
- Use the browser DevTools console to inspect socket events and WebRTC activity.

## TODO / Next improvements
- Add Tailwind CSS for styling (in progress)
- Add tests and CI
- Improve error handling and UX for reconnection

---
If you'd like, I can:
- finish Tailwind installation and wire it into the project,
- create a short CONTRIBUTING.md with dev recommendations, or
- prepare a production build and simple Dockerfiles.
