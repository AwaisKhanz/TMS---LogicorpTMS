"use client";

import { useJsApiLoader } from "@react-google-maps/api";
import { ReactNode } from "react";

const libraries: ("places" | "geometry" | "drawing" | "visualization")[] = [
  "places",
];

interface GoogleMapsLoaderProps {
  children: ReactNode;
}

export function GoogleMapsLoader({ children }: GoogleMapsLoaderProps) {
  const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;

  const { isLoaded, loadError } = useJsApiLoader({
    id: "google-map-script",
    googleMapsApiKey: apiKey || "",
    libraries,
  });

  if (loadError) {
    return (
      <div className="text-sm text-destructive">
        Error loading Google Maps. Please check your API key configuration.
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div className="text-sm text-muted-foreground">
        Loading Google Maps...
      </div>
    );
  }

  return <>{children}</>;
}

