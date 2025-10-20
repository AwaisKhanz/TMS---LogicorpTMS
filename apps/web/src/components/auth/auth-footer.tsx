import Link from "next/link";

export function AuthFooter() {
  return (
    <p className="text-center text-sm text-muted-foreground">
      By continuing, you agree to our{" "}
      <Link href="/terms" className="underline hover:text-primary">
        Terms of Service
      </Link>{" "}
      and{" "}
      <Link href="/privacy" className="underline hover:text-primary">
        Privacy Policy
      </Link>
    </p>
  );
}
