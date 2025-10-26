"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
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
import { Loader2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/contexts/auth-context";
import { authService } from "@/services/auth.service";
import { useEffect, useState } from "react";
import { AuthHeader } from "@/components/auth/auth-header";
import { AuthFooter } from "@/components/auth/auth-footer";

const acceptInvitationSchema = z
  .object({
    password: z.string().min(8, "Password must be at least 8 characters"),
    confirmPassword: z.string().min(8, "Password confirmation is required"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type AcceptInvitationFormData = z.infer<typeof acceptInvitationSchema>;

function AcceptInvitationForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { login } = useAuth();
  const token = searchParams.get("token");
  const [invitationDetails, setInvitationDetails] = useState<{
    organizationName: string;
    inviterName: string;
    roles: string[];
  } | null>(null);
  const [isValidating, setIsValidating] = useState(true);

  const form = useForm<AcceptInvitationFormData>({
    resolver: zodResolver(acceptInvitationSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  // Validate token and get invitation details
  useEffect(() => {
    const validateToken = async () => {
      if (!token) {
        setIsValidating(false);
        return;
      }

      try {
        // Fetch invitation details from backend using auth service
        const data = await authService.validateInvitation(token);
        setInvitationDetails({
          organizationName: data.organizationName,
          inviterName: data.inviterName,
          roles: data.roles,
        });
      } catch (error) {
        console.error("Token validation error:", error);
        toast.error("Invalid invitation token");
      } finally {
        setIsValidating(false);
      }
    };

    validateToken();
  }, [token]);

  const onSubmit = async (data: AcceptInvitationFormData) => {
    if (!token) {
      toast.error("Invalid invitation link");
      return;
    }

    try {
      const result = await authService.acceptInvitation({
        token,
        password: data.password,
      });

      // Login the user automatically
      await login(result.data.user.email, data.password);
    } catch (error) {
      console.error("Accept invitation error:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to accept invitation"
      );
    }
  };

  if (isValidating) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  if (!token) {
    return (
      <>
        <AuthHeader
          title="Invalid Invitation"
          description="This invitation link is invalid or has expired."
        />
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <Button
            onClick={() => router.push("/login")}
            className="w-full"
            size="lg"
          >
            Go to Login
          </Button>
        </div>
        <AuthFooter />
      </>
    );
  }

  return (
    <>
      <AuthHeader
        title="Accept Team Invitation"
        description="Set your password to complete your account setup"
      />

      {invitationDetails && (
        <div className="p-4 bg-muted rounded-lg">
          <h4 className="font-semibold text-sm mb-2">Invitation Details</h4>
          <div className="space-y-1 text-sm text-muted-foreground">
            <p>
              <strong>Organization:</strong>{" "}
              {invitationDetails.organizationName}
            </p>
            <p>
              <strong>Role:</strong> {invitationDetails.roles.join(", ")}
            </p>
            <p>
              <strong>Invited by:</strong> {invitationDetails.inviterName}
            </p>
          </div>
        </div>
      )}

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Enter your password"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Confirm Password</FormLabel>
                <FormControl>
                  <Input
                    {...field}
                    type="password"
                    placeholder="Confirm your password"
                    disabled={form.formState.isSubmitting}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={form.formState.isSubmitting}
          >
            {form.formState.isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Setting up your account...
              </>
            ) : (
              "Accept Invitation"
            )}
          </Button>
        </form>
      </Form>

      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          By accepting this invitation, you agree to join the organization and
          will have access based on your assigned role.
        </AlertDescription>
      </Alert>

      <AuthFooter />
    </>
  );
}

export default function AcceptInvitationPage() {
  return (
    <div className="w-full max-w-md space-y-8">
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        }
      >
        <AcceptInvitationForm />
      </Suspense>
    </div>
  );
}
