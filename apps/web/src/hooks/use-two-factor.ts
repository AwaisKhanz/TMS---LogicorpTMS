"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import { toast } from "sonner";

export function useTwoFactor() {
  const [isSetupDialogOpen, setIsSetupDialogOpen] = useState(false);

  // Setup 2FA - Generate QR code
  const setupMutation = useMutation({
    mutationFn: () => authService.setup2FA(),
    onSuccess: () => {
      setIsSetupDialogOpen(true);
    },
    onError: (error) => {
      const apiError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error("Failed to setup 2FA", {
        description:
          apiError.response?.data?.error?.message || "Please try again",
      });
    },
  });

  // Enable 2FA after verification
  const enableMutation = useMutation({
    mutationFn: (token: string) => authService.enable2FA(token),
    onSuccess: () => {
      toast.success("Two-Factor Authentication Enabled", {
        description: "Your account is now more secure!",
      });
      setIsSetupDialogOpen(false);
    },
    onError: (error) => {
      const apiError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error("Invalid Code", {
        description:
          apiError.response?.data?.error?.message ||
          "Please check your authenticator app and try again",
      });
    },
  });

  // Disable 2FA
  const disableMutation = useMutation({
    mutationFn: (token: string) => authService.disable2FA(token),
    onSuccess: () => {
      toast.success("Two-Factor Authentication Disabled", {
        description: "2FA has been removed from your account",
      });
    },
    onError: (error) => {
      const apiError = error as {
        response?: { data?: { error?: { message?: string } } };
      };
      toast.error("Failed to disable 2FA", {
        description:
          apiError.response?.data?.error?.message ||
          "Invalid verification code",
      });
    },
  });

  // Verify 2FA token
  const verifyMutation = useMutation({
    mutationFn: (token: string) => authService.verify2FA(token),
  });

  return {
    // State
    isSetupDialogOpen,
    setIsSetupDialogOpen,

    // Setup 2FA
    setup: setupMutation.mutate,
    setupData: setupMutation.data,
    isSettingUp: setupMutation.isPending,

    // Enable 2FA
    enable: enableMutation.mutate,
    isEnabling: enableMutation.isPending,

    // Disable 2FA
    disable: disableMutation.mutate,
    isDisabling: disableMutation.isPending,

    // Verify 2FA
    verify: verifyMutation.mutate,
    verifyData: verifyMutation.data,
    isVerifying: verifyMutation.isPending,
  };
}
