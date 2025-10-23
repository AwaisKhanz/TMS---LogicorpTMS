"use client";

import { Button } from "@/components/ui/button";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { cn } from "@/lib/utils";

interface LoadFormSidebarProps {
  currentStep: number;
}

const steps = [
  {
    id: 1,
    title: "Load Information",
    description: "Customer and reference details",
  },
  {
    id: 2,
    title: "Shipper Details",
    description: "Pickup location and timing",
  },
  {
    id: 3,
    title: "Consignee Details",
    description: "Delivery location and timing",
  },
  {
    id: 4,
    title: "Load Specifications",
    description: "Commodity and equipment details",
  },
  {
    id: 5,
    title: "Rates & Pricing",
    description: "Customer and carrier rates",
  },
  {
    id: 6,
    title: "Additional Info",
    description: "Notes and special instructions",
  },
];

export function LoadFormSidebar({ currentStep }: LoadFormSidebarProps) {
  return (
    <div className="w-80 bg-gradient-to-b from-background to-muted/20 border-r border-border shadow-lg">
      <div className="p-6 h-full flex flex-col">
        <Button
          variant="outline"
          size="sm"
          asChild
          className="mb-8 hover:bg-muted/50 transition-colors"
        >
          <Link href="/loads">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Loads
          </Link>
        </Button>

        <div className="flex-1 space-y-8">
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              Create New Load
            </h1>
            <p className="text-muted-foreground text-sm">
              Complete all steps to create your shipment
            </p>
          </div>

          {/* Step Navigation */}
          <div className="space-y-6">
            {steps.map((step, index) => (
              <div key={step.id} className="relative">
                <div className="flex items-start space-x-4">
                  <div
                    className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 shadow-sm",
                      currentStep > step.id
                        ? "bg-success text-success-foreground shadow-success/20"
                        : currentStep === step.id
                          ? "bg-primary text-primary-foreground shadow-primary/20 ring-2 ring-primary/20"
                          : "bg-muted text-muted-foreground"
                    )}
                  >
                    {currentStep > step.id ? (
                      <Check className="h-5 w-5" />
                    ) : (
                      <span className="text-sm font-bold">{step.id}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className={cn(
                        "font-semibold text-sm transition-colors",
                        currentStep >= step.id
                          ? "text-foreground"
                          : "text-muted-foreground"
                      )}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>
                </div>

                {/* Connecting Line */}
                {index < steps.length - 1 && (
                  <div className="absolute left-5 top-10 w-0.5 h-6 bg-gradient-to-b from-muted to-transparent" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Progress Summary */}
        <div className="mt-8 p-4 bg-muted/30 rounded-lg border">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Progress</span>
            <span className="font-semibold text-foreground">
              {Math.round((currentStep / steps.length) * 100)}%
            </span>
          </div>
          <div className="mt-2 w-full bg-muted rounded-full h-2">
            <div
              className="bg-primary h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
