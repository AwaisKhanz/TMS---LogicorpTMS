"use client";

import { useAuth } from "./use-auth";

export function useOrganization() {
  const { organizationId, organizationName, isLoading } = useAuth();

  return {
    organizationId,
    organizationName,
    isLoading,
  };
}
