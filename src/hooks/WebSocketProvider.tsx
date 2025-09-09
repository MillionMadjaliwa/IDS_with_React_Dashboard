import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { realPacketCaptureService } from "../lib/real-packet-capture-service";

interface WebSocketContextValue {
  isConnected: boolean;
  connectionStatus: string;
  reconnect: () => void;
}

const WebSocketContext = createContext<WebSocketContextValue | undefined>(undefined);

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const reconnecting = useRef(false);

  useEffect(() => {
    let mounted = true;
    function handleStatus(status: string) {
      setConnectionStatus(status);
      setIsConnected(status === "connected");
    }
    realPacketCaptureService.addConnectionListener(handleStatus);
    // Connect once at mount
    realPacketCaptureService.connect().catch(() => {});
    return () => {
      mounted = false;
      // Cleanup: If realPacketCaptureService supports removing listeners, add it here.
      // Otherwise, no cleanup needed for connection listener.
      // Optionally: do not disconnect here to keep connection alive globally
    };
  }, []);

  const reconnect = () => {
    if (reconnecting.current) return;
    reconnecting.current = true;
    realPacketCaptureService.connect().finally(() => {
      reconnecting.current = false;
    });
  };

  return (
    <WebSocketContext.Provider value={{ isConnected, connectionStatus, reconnect }}>
      {children}
    </WebSocketContext.Provider>
  );
};

export function useWebSocketStatus() {
  const ctx = useContext(WebSocketContext);
  if (!ctx) throw new Error("useWebSocketStatus must be used within WebSocketProvider");
  return ctx;
}
