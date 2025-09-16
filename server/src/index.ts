import express, { Request, Response } from 'express';
import path from 'path';
import multer from 'multer';
import WebSocket from 'ws';
import http from 'http';
import cors from 'cors';

import setupApiRoutes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000' }));

// Serve React static files (for production)
app.use(express.static(path.join(__dirname, '../client/dist')));

setupApiRoutes(app);

// Catch-all: send React index.html
app.get('*', (req: Request, res: Response) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

// Create HTTP server from Express
const server = http.createServer(app);

// Create WebSocket server
const wss = new WebSocket.Server({ server });

// Keep track of connected clients
const clients: Set<WebSocket> = new Set();

// Override console.log to broadcast messages
const originalLog = console.log;
console.log = (...args) => {
  originalLog(...args);
  const msg = args
    .map((a) => (typeof a === 'string' ? a : JSON.stringify(a)))
    .join(' ');
  clients.forEach((ws) => ws.send(msg));
};

// WebSocket connection
wss.on('connection', (ws) => {
  clients.add(ws);
  ws.send('✅ Connected to WebSocket server');

  ws.on('close', () => clients.delete(ws));
});

server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
