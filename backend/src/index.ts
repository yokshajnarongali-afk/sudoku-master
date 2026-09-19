import http from "http";
import { Server as SocketIOServer } from "socket.io";
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
    origin: FRONTEND_URL ?? "http://localhost:3000",
    methods: ["GET", "POST"],
  },
});

setupSocketHandlers(io);

httpServer.listen(PORT, () => {
  console.log(`[server] running on http://localhost:${PORT}`);
});
