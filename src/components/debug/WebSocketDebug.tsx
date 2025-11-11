"use client";

/**
 * WebSocket Debug Component
 * Shows real-time WebSocket status and received events
 */

import { useState, useEffect } from "react";
import { useWebSocket } from "@/components/providers/WebSocketProvider";
import { WebSocketEvent } from "@/lib/websocket/types";

export function WebSocketDebug() {
  const { socket, isConnected } = useWebSocket();
  const [events, setEvents] = useState<Array<{ event: string; data: any; time: string }>>([]);

  useEffect(() => {
    if (!socket || !isConnected) return;

    // Listen to ALL WebSocket events for debugging
    const eventTypes = Object.values(WebSocketEvent);

    const handlers = eventTypes.map((eventType) => {
      const handler = (data: any) => {
        console.log(`📥 DEBUG: Received ${eventType}`, data);
        setEvents((prev) => [
          {
            event: eventType,
            data: JSON.stringify(data, null, 2),
            time: new Date().toLocaleTimeString(),
          },
          ...prev.slice(0, 9), // Keep last 10 events
        ]);
      };

      socket.on(eventType, handler);
      return { eventType, handler };
    });

    return () => {
      handlers.forEach(({ eventType, handler }) => {
        socket.off(eventType, handler);
      });
    };
  }, [socket, isConnected]);

  if (process.env.NODE_ENV === "production") return null;

  return (
    <div className="fixed bottom-4 right-4 w-96 max-h-96 bg-black/90 text-white text-xs p-4 rounded-lg overflow-auto z-50 font-mono">
      <div className="flex items-center justify-between mb-2 sticky top-0 bg-black/90 pb-2">
        <div className="font-bold">WebSocket Debug</div>
        <div className="flex items-center gap-2">
          <span className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500" : "bg-red-500"}`} />
          <span>{isConnected ? "Connected" : "Disconnected"}</span>
        </div>
      </div>

      <div className="space-y-2">
        {events.length === 0 ? (
          <div className="text-gray-400">Waiting for events...</div>
        ) : (
          events.map((event, index) => (
            <div key={index} className="border border-gray-700 rounded p-2">
              <div className="flex justify-between mb-1">
                <span className="text-green-400 font-bold">{event.event}</span>
                <span className="text-gray-500">{event.time}</span>
              </div>
              <pre className="text-yellow-300 overflow-x-auto">{event.data}</pre>
            </div>
          ))
        )}
      </div>

      {socket && (
        <div className="mt-2 pt-2 border-t border-gray-700 text-gray-400">
          Socket ID: {socket.id}
        </div>
      )}
    </div>
  );
}
