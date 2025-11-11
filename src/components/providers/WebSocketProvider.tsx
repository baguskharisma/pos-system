"use client";

/**
 * WebSocket Provider Component
 * Manages WebSocket connection and provides context to the app
 */

import { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import { io, Socket } from "socket.io-client";
import { toast } from "sonner";
import type {
  ServerToClientEvents,
  ClientToServerEvents,
  WebSocketRoom,
  WebSocketEvent,
} from "@/lib/websocket/types";

interface WebSocketContextValue {
  socket: Socket<ServerToClientEvents, ClientToServerEvents> | null;
  isConnected: boolean;
  joinRoom: (room: WebSocketRoom) => void;
  leaveRoom: (room: WebSocketRoom) => void;
  on: <E extends keyof ServerToClientEvents>(
    event: E,
    callback: ServerToClientEvents[E]
  ) => void;
  off: <E extends keyof ServerToClientEvents>(
    event: E,
    callback: ServerToClientEvents[E]
  ) => void;
}

const WebSocketContext = createContext<WebSocketContextValue | null>(null);

interface WebSocketProviderProps {
  children: React.ReactNode;
  autoConnect?: boolean;
  showNotifications?: boolean;
}

export function WebSocketProvider({
  children,
  autoConnect = true,
  showNotifications = true,
}: WebSocketProviderProps) {
  const [socket, setSocket] = useState<Socket<
    ServerToClientEvents,
    ClientToServerEvents
  > | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;

  useEffect(() => {
    if (!autoConnect) return;

    // Create socket connection
    const socketUrl = process.env.NEXT_PUBLIC_WEBSOCKET_URL || window.location.origin;
    const newSocket = io(socketUrl, {
      transports: ["websocket", "polling"],
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      reconnectionAttempts: maxReconnectAttempts,
    });

    // Connection event handlers
    newSocket.on("connect", () => {
      console.log("WebSocket connected:", newSocket.id);
      setIsConnected(true);
      reconnectAttempts.current = 0;

      if (showNotifications) {
        toast.success("Connected to real-time updates");
      }
    });

    newSocket.on("disconnect", (reason) => {
      console.log("WebSocket disconnected:", reason);
      setIsConnected(false);

      if (showNotifications && reason === "io server disconnect") {
        toast.error("Disconnected from server");
      }
    });

    newSocket.on("connect_error", (error) => {
      console.error("WebSocket connection error:", error);
      reconnectAttempts.current++;

      if (
        showNotifications &&
        reconnectAttempts.current >= maxReconnectAttempts
      ) {
        toast.error("Failed to connect to real-time updates");
      }
    });

    newSocket.io.on("reconnect_attempt", (attempt) => {
      console.log(`WebSocket reconnection attempt ${attempt}`);
      if (showNotifications && attempt === 1) {
        toast.info("Reconnecting...");
      }
    });

    newSocket.io.on("reconnect", (attempt) => {
      console.log(`WebSocket reconnected after ${attempt} attempts`);
      if (showNotifications) {
        toast.success("Reconnected to real-time updates");
      }
    });

    newSocket.io.on("reconnect_failed", () => {
      console.error("WebSocket reconnection failed");
      if (showNotifications) {
        toast.error("Could not reconnect. Please refresh the page.");
      }
    });

    setSocket(newSocket);

    // Cleanup on unmount
    return () => {
      newSocket.close();
    };
  }, [autoConnect, showNotifications]);

  const joinRoom = useCallback(
    (room: WebSocketRoom) => {
      if (socket && isConnected) {
        socket.emit("join:room", room);
        console.log(`Joined room: ${room}`);
      }
    },
    [socket, isConnected]
  );

  const leaveRoom = useCallback(
    (room: WebSocketRoom) => {
      if (socket && isConnected) {
        socket.emit("leave:room", room);
        console.log(`Left room: ${room}`);
      }
    },
    [socket, isConnected]
  );

  const on = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      callback: ServerToClientEvents[E]
    ) => {
      if (socket) {
        socket.on(event, callback as any);
      }
    },
    [socket]
  );

  const off = useCallback(
    <E extends keyof ServerToClientEvents>(
      event: E,
      callback: ServerToClientEvents[E]
    ) => {
      if (socket) {
        socket.off(event, callback as any);
      }
    },
    [socket]
  );

  const value: WebSocketContextValue = {
    socket,
    isConnected,
    joinRoom,
    leaveRoom,
    on,
    off,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
}

/**
 * Hook to use WebSocket context
 */
export function useWebSocket() {
  const context = useContext(WebSocketContext);

  if (!context) {
    throw new Error("useWebSocket must be used within a WebSocketProvider");
  }

  return context;
}
