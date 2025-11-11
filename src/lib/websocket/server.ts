/**
 * WebSocket Server Setup
 */

import { Server as HTTPServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  WebSocketRoom,
} from "./types";

let io: SocketIOServer<
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData
> | null = null;

/**
 * Initialize WebSocket server
 */
export function initializeWebSocketServer(httpServer: HTTPServer) {
  if (io) {
    console.log("WebSocket server already initialized");
    return io;
  }

  io = new SocketIOServer<
    ClientToServerEvents,
    ServerToClientEvents,
    InterServerEvents,
    SocketData
  >(httpServer, {
    cors: {
      origin:
        process.env.NODE_ENV === "production"
          ? process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
          : ["http://localhost:3000", "http://localhost:3001"],
      credentials: true,
    },
    transports: ["websocket", "polling"],
  });

  // Connection handler
  io.on("connection", (socket) => {
    console.log(`Client connected: ${socket.id}`);

    // Initialize socket data
    socket.data.rooms = [];

    // Join room handler
    socket.on("join:room", (room: WebSocketRoom) => {
      socket.join(room);
      socket.data.rooms.push(room);
      console.log(`Socket ${socket.id} joined room: ${room}`);
    });

    // Leave room handler
    socket.on("leave:room", (room: WebSocketRoom) => {
      socket.leave(room);
      socket.data.rooms = socket.data.rooms.filter((r) => r !== room);
      console.log(`Socket ${socket.id} left room: ${room}`);
    });

    // Ping handler
    socket.on("ping", (callback) => {
      callback("pong");
    });

    // Disconnect handler
    socket.on("disconnect", (reason) => {
      console.log(`Client disconnected: ${socket.id}, reason: ${reason}`);
    });

    // Error handler
    socket.on("error", (error) => {
      console.error(`Socket error for ${socket.id}:`, error);
    });
  });

  console.log("WebSocket server initialized");
  return io;
}

/**
 * Get the WebSocket server instance
 */
export function getWebSocketServer() {
  if (!io) {
    throw new Error("WebSocket server not initialized. Call initializeWebSocketServer first.");
  }
  return io;
}

/**
 * Check if WebSocket server is initialized
 */
export function isWebSocketServerInitialized() {
  return io !== null;
}

/**
 * Close WebSocket server
 */
export function closeWebSocketServer() {
  if (io) {
    io.close();
    io = null;
    console.log("WebSocket server closed");
  }
}
