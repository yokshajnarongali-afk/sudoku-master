import http from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { createClient } from "redis";
import { createApp } from "./app";
import { setupSocketHandlers } from "./socket";
import type { 
  ClientToServerEvents, 
  ServerToClientEvents, 
  InterServerEvents, 
  SocketData 
} from "@sudoku/shared";

const PORT_ENV = process.env["PORT"] ?? "3001";
const PORT = parseInt(PORT_ENV, 10);
if (isNaN(PORT) || PORT <= 0 || PORT > 65535) {
  console.error("Invalid PORT environment variable specified");
  process.exit(1);
}

const FRONTEND_URL = process.env["FRONTEND_URL"];
if (FRONTEND_URL && !FRONTEND_URL.startsWith("http")) {
  console.warn("FRONTEND_URL should likely start with http:// or https://");
}

const app = createApp();
const httpServer = http.createServer(app);

const io = new SocketIOServer<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>(httpServer, {
  cors: {
    origin: FRONTEND_URL ?? "*", // Relaxed to allow local testing easily
    methods: ["GET", "POST"],
  },
});

async function startServer() {
  if (process.env["REDIS_URL"]) {
    try {
      const pubClient = createClient({ url: process.env["REDIS_URL"] });
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => console.error('[Redis Pub] Error:', err));
      subClient.on('error', (err) => console.error('[Redis Sub] Error:', err));

      await Promise.all([pubClient.connect(), subClient.connect()]);
      io.adapter(createAdapter(pubClient, subClient));
      console.log(`[socket] Redis adapter successfully connected`);
    } catch (error) {
      console.error('[socket] Failed to connect Redis adapter. Falling back to in-memory.', error);
    }
  } else {
    console.log('[socket] No REDIS_URL provided. Using in-memory adapter (not horizontally scalable).');
  }

  setupSocketHandlers(io);

  httpServer.listen(PORT, () => {
    console.log(`[server] running on http://localhost:${PORT}`);
  });
}

startServer().catch(console.error);
