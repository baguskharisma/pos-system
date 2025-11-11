"use client";

/**
 * Custom hook to listen to WebSocket events
 */

import { useEffect, useCallback } from "react";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import type { ServerToClientEvents } from "@/lib/websocket/types";

export function useWebSocketEvent<E extends keyof ServerToClientEvents>(
  event: E,
  callback: ServerToClientEvents[E],
  deps: React.DependencyList = []
) {
  const { on, off, isConnected } = useWebSocket();

  // Memoize the callback to avoid unnecessary re-subscriptions
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memoizedCallback = useCallback(callback, deps);

  useEffect(() => {
    if (!isConnected) {
      console.log(`⏸️ Not connected, waiting to listen for: ${event}`);
      return;
    }

    console.log(`👂 Listening for event: ${event}`);
    on(event, memoizedCallback);

    return () => {
      console.log(`🔇 Stopped listening for: ${event}`);
      off(event, memoizedCallback);
    };
  }, [event, memoizedCallback, on, off, isConnected]);
}
