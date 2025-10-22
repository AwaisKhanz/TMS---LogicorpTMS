"use client";

import { useAuth } from "@/contexts/auth-context";

export function useOrganization() {
  const { organization, isLoading } = useAuth();

  return {
    organizationId: organization?.id,
    organizationName: organization?.name,
    organization,
    isLoading,
  };
}
