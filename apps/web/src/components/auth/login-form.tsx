"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { TwoFactorVerifyInput } from "@/components/features/two-factor";
import { Loader2, Mail, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";

const loginSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  password: z.string().min(1, "Password is required"),
  twoFactorToken: z.string().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [requires2FA, setRequires2FA] = useState(false);
  const [twoFactorToken, setTwoFactorToken] = useState("");
  const [credentials, setCredentials] = useState<{
    email: string;
    password: string;
  } | null>(null);

  const form = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      twoFactorToken: "",
    },
  });

  const handleLogin = async (
    email: string,
    password: string,
    token?: string
  ) => {
    try {
      const response = await login(email, password, token);

      if (response.requires2FA && !token) {
        // 2FA is required but not provided
        setRequires2FA(true);
        setCredentials({ email, password });
        toast.info("Two-Factor Authentication Required", {
          description: "Please enter the code from your authenticator app.",
        });
        return;
      }

      // Login successful
      toast.success("Welcome back!", {
        description: "You have successfully logged in.",
      });
      router.push("/");
      router.refresh();
    } catch (error) {
      const apiError = error as {
        response?: { status?: number; data?: { error?: { message?: string } } };
      };
      console.error("Login error:", error);

      if (apiError.response?.status === 401) {
        const errorMessage =
          apiError.response?.data?.error?.message ||
          "Invalid credentials or 2FA code.";

        // Check if it's an email verification error
        if (errorMessage.includes("verify your email")) {
          toast.error("Email Verification Required", {
            description: "Please verify your email address before logging in.",
          });
          // Redirect to verify-email page with email parameter
          router.push(`/verify-email?email=${encodeURIComponent(email)}`);
          return;
        }

        toast.error("Login Failed", {
          description: errorMessage,
        });
      } else {
        toast.error("Something went wrong", {
          description: "Please try again later.",
        });
      }
    }
  };

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);

    try {
      await handleLogin(data.email, data.password, data.twoFactorToken);
    } finally {
      setIsLoading(false);
    }
  };

  const handleTwoFactorSubmit = async (code: string) => {
    if (code.length === 6 && credentials) {
      setIsLoading(true);
      setTwoFactorToken(code);

      try {
        await handleLogin(credentials.email, credentials.password, code);
      } finally {
        setIsLoading(false);
      }
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {!requires2FA ? (
          <>
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email Address</FormLabel>
                  <FormControl>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="email"
                        placeholder="name@company.com"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <div className="flex items-center justify-between">
                    <FormLabel>Password</FormLabel>
                    <Link
                      href="/forgot-password"
                      className="text-sm text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <FormControl>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        {...field}
                        type="password"
                        placeholder="Enter your password"
                        className="pl-10"
                        disabled={isLoading}
                      />
                    </div>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </>
        ) : (
          <div className="space-y-6">
            <Alert>
              <ShieldCheck className="h-4 w-4" />
              <AlertDescription>
                Two-factor authentication is enabled for this account. Enter the
                6-digit code from your authenticator app.
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                Authentication Code
              </label>
              <TwoFactorVerifyInput
                value={twoFactorToken}
                onChange={setTwoFactorToken}
                onComplete={handleTwoFactorSubmit}
                disabled={isLoading}
              />
            </div>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setRequires2FA(false);
                  setTwoFactorToken("");
                  setCredentials(null);
                }}
                disabled={isLoading}
              >
                Back
              </Button>
              <Button
                type="button"
                className="flex-1"
                onClick={() => handleTwoFactorSubmit(twoFactorToken)}
                disabled={isLoading || twoFactorToken.length !== 6}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Verifying...
                  </>
                ) : (
                  "Verify & Sign in"
                )}
              </Button>
            </div>
          </div>
        )}
      </form>
    </Form>
  );
}
