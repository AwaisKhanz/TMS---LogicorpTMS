"use client";

import { Wifi, WifiOff, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useWebSocket } from "@/contexts/websocket-context";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export function ConnectionStatus() {
  const { isConnected, connectionError, reconnectAttempts } = useWebSocket();

  const getStatusInfo = () => {
    if (isConnected) {
      return {
        icon: Wifi,
        color: "text-success",
        label: "Connected",
        description: "Real-time notifications enabled",
      };
    }

    if (connectionError) {
      return {
        icon: WifiOff,
        color: "text-destructive",
        label: "Disconnected",
        description: `Connection failed: ${connectionError}${
          reconnectAttempts > 0 ? ` (Attempt ${reconnectAttempts})` : ""
        }`,
      };
    }

    return {
      icon: AlertCircle,
      color: "text-warning",
      label: "Connecting",
      description:
        reconnectAttempts > 0
          ? `Reconnecting... (Attempt ${reconnectAttempts})`
          : "Establishing connection...",
    };
  };

  const { icon: Icon, color, label, description } = getStatusInfo();

  return (
    <TooltipProvider>
      <Tooltip>
        <TooltipTrigger asChild>
          <div className={cn("flex items-center space-x-1", color)}>
            <Icon className="h-3 w-3" />
            <span className="text-xs font-medium hidden sm:inline">
              {label}
            </span>
          </div>
        </TooltipTrigger>
        <TooltipContent>
          <p className="text-sm">{description}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
