import Link from "next/link";
import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  /**
   * Size variant of the logo
   */
  size?: "sm" | "md" | "lg" | "xl";
  /**
   * Whether to show the text alongside the icon
   */
  showText?: boolean;
  /**
   * Whether the logo should be a link to home
   */
  href?: string;
  /**
   * Custom className
   */
  className?: string;
  /**
   * Icon className
   */
  iconClassName?: string;
  /**
   * Text className
   */
  textClassName?: string;
}

const sizeClasses = {
  sm: {
    container: "h-8 w-8",
    iconSize: 32,
    text: "text-lg",
  },
  md: {
    container: "h-10 w-10",
    iconSize: 40,
    text: "text-xl",
  },
  lg: {
    container: "h-12 w-12",
    iconSize: 48,
    text: "text-2xl",
  },
  xl: {
    container: "h-16 w-16",
    iconSize: 64,
    text: "text-3xl",
  },
};

export function Logo({
  size = "md",
  showText = true,
  href,
  className,
  iconClassName,
  textClassName,
}: LogoProps) {
  const sizes = sizeClasses[size];

  const logoContent = (
    <div className={cn("flex items-center gap-2", className)}>
      {/* Logo Icon/Image */}
      <div className={cn("relative", sizes.container, iconClassName)}>
        <Image
          src="/logo.png"
          alt="LogicorpTMS"
          width={sizes.iconSize}
          height={sizes.iconSize}
          className=" h-full w-full object-contain"
        />
      </div>

      {/* Logo Text */}
      {showText && (
        <span
          className={cn("font-bold tracking-tight", sizes.text, textClassName)}
        >
          <span className="text-primary">Logicorp</span>
          <span className="text-foreground">TMS</span>
        </span>
      )}
    </div>
  );

  // If href is provided, wrap in Link
  if (href) {
    return (
      <Link href={href} className="inline-flex">
        {logoContent}
      </Link>
    );
  }

  return logoContent;
}
