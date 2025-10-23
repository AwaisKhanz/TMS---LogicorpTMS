"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const router = useRouter();

  const handleGoBack = () => {
    router.back();
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl space-y-8">
        {/* Main Error Card */}
        <Card className="border-2 border-border">
          <CardContent className="pt-8 pb-6">
            <div className="text-center space-y-6">
              {/* Large 404 Display */}
              <div className="space-y-4">
                <div className="mx-auto w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <FileQuestion className="h-10 w-10 text-primary" />
                </div>
                <div className="space-y-1">
                  <h1 className="text-6xl font-bold text-primary">404</h1>
                  <h2 className="text-2xl font-semibold text-foreground">
                    Page Not Found
                  </h2>
                </div>
              </div>

              {/* Description */}
              <div className="max-w-md mx-auto">
                <p className="text-muted-foreground leading-relaxed">
                  The page you&apos;re looking for doesn&apos;t exist or has
                  been moved. Don&apos;t worry, it happens to the best of us.
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center max-w-sm mx-auto">
                <Button
                  onClick={handleGoBack}
                  variant="outline"
                  className="flex-1"
                  size="lg"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Go Back
                </Button>

                <Link href="/" className="flex-1">
                  <Button className="w-full" size="lg">
                    <Home className="mr-2 h-4 w-4" />
                    Home
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            If you believe this is an error, please contact support
          </p>
          <p className="text-xs text-muted-foreground">
            LogicorpTMS - Transportation Management System
          </p>
        </div>
      </div>
    </div>
  );
}
