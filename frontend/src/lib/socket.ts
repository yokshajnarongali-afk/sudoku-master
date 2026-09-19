import { io, Socket } from "socket.io-client";
import type { 
  ServerToClientEvents, 
  ClientToServerEvents, 
  PlayerIdentity 
} from "@sudoku/shared";

const SOCKET_URL = process.env["NEXT_PUBLIC_SOCKET_URL"] || "http://localhost:3001";

// A singleton instance will be created only when initializeSocket is called
let socket: Socket<ServerToClientEvents, ClientToServerEvents> | null = null;

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const initializeSocket = (identity: PlayerIdentity) => {
  if (socket) {
    // If identity changed, we need to reconnect with new identity
    if (socket.auth && (socket.auth as any).identity?.id !== identity.id) {
      socket.disconnect();
    } else {
      return socket; // already connected with same identity
    }
  }

  socket = io(SOCKET_URL, {
    auth: {
      identity,
    },
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: Infinity,
    reconnectionDelay: 1000,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
