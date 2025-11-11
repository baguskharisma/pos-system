"use client";

/**
 * Custom hook to manage WebSocket room subscriptions
 */

import { useEffect } from "react";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import type { WebSocketRoom } from "@/lib/websocket/types";

export function useWebSocketRoom(room: WebSocketRoom, enabled = true) {
  const { joinRoom, leaveRoom, isConnected } = useWebSocket();

  useEffect(() => {
    if (!enabled || !isConnected) return;

    joinRoom(room);

    return () => {
      leaveRoom(room);
    };
  }, [room, enabled, isConnected, joinRoom, leaveRoom]);
}
