/**
 * @deprecated This file is deprecated. Use SocketManager from @/lib/socket-manager instead.
 * This file is kept for backward compatibility but will be removed in future versions.
 */

"use client";

import { SocketManager } from "@/lib/socket-manager";
import { debugLogger } from "@/utils/debug";

// Legacy function - now delegates to SocketManager
export const createSocket = (token) => {
  debugLogger.warn(
    "createSocket is deprecated. Use SocketManager.getInstance() instead."
  );
  return SocketManager.getInstance(token);
};

// Legacy export - now returns null as SocketManager handles the instance
export const socket = null;
