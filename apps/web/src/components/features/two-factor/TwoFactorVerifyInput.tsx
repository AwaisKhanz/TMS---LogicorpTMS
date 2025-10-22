"use client";

import { useRef, useState, KeyboardEvent, ClipboardEvent } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface TwoFactorVerifyInputProps {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
}

export function TwoFactorVerifyInput({
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
}: TwoFactorVerifyInputProps) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [digits, setDigits] = useState<string[]>(
    value ? value.split("").slice(0, 6) : Array(6).fill("")
  );

  const handleChange = (index: number, newValue: string) => {
    // Only allow digits
    if (newValue && !/^\d$/.test(newValue)) return;

    const newDigits = [...digits];
    newDigits[index] = newValue;
    setDigits(newDigits);

    const newFullValue = newDigits.join("");
    onChange(newFullValue);

    // Auto-focus next input
    if (newValue && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // Call onComplete when all 6 digits are entered
    if (newFullValue.length === 6 && onComplete) {
      onComplete(newFullValue);
    }
  };

  const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      // Move to previous input on backspace
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowLeft" && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste = (e: ClipboardEvent<HTMLInputElement>) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    const pastedDigits = pastedData.match(/\d/g) || [];

    if (pastedDigits.length > 0) {
      const newDigits = [...digits];
      pastedDigits.slice(0, 6).forEach((digit, idx) => {
        newDigits[idx] = digit;
      });
      setDigits(newDigits);

      const newFullValue = newDigits.join("");
      onChange(newFullValue);

      // Focus last filled input or first empty one
      const nextEmptyIndex = newDigits.findIndex((d) => !d);
      const focusIndex = nextEmptyIndex === -1 ? 5 : nextEmptyIndex;
      inputRefs.current[focusIndex]?.focus();

      // Call onComplete if all 6 digits are filled
      if (newFullValue.length === 6 && onComplete) {
        onComplete(newFullValue);
      }
    }
  };

  return (
    <div className="flex gap-2 justify-center">
      {digits.map((digit, index) => (
        <Input
          key={index}
          ref={(el) => {
            inputRefs.current[index] = el;
          }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-semibold",
            error && "border-destructive focus-visible:ring-destructive"
          )}
          autoFocus={index === 0}
        />
      ))}
    </div>
  );
}
