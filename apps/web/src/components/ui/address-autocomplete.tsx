"use client";

import { useEffect, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Loader2, MapPin } from "lucide-react";

export interface AddressComponents {
  street: string;
  city: string;
  state: string;
  zip: string;
  country: string;
  formattedAddress: string;
  placeId?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
}

interface AddressAutocompleteProps {
  value?: string;
  onChange?: (address: string, components?: AddressComponents) => void;
  onSelect?: (components: AddressComponents) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  error?: boolean;
  countryRestriction?: string; // ISO 3166-1 Alpha-2 country code (e.g., "us")
}

// Singleton pattern to share Google Maps services across all component instances
// This reduces deprecation warnings by initializing services only once
class GoogleMapsPlacesService {
  private static instance: GoogleMapsPlacesService | null = null;
  private autocompleteService: google.maps.places.AutocompleteService | null = null;
  private placesService: google.maps.places.PlacesService | null = null;
  private isInitialized = false;
  private initPromise: Promise<void> | null = null;

  private constructor() {}

  static getInstance(): GoogleMapsPlacesService {
    if (!GoogleMapsPlacesService.instance) {
      GoogleMapsPlacesService.instance = new GoogleMapsPlacesService();
    }
    return GoogleMapsPlacesService.instance;
  }

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return Promise.resolve();
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve) => {
      const checkGoogleMaps = () => {
        if (window.google?.maps?.places) {
          // Temporarily suppress console warnings during initialization
          // These warnings come from Google's library and cannot be prevented otherwise
          const originalWarn = console.warn;
          const suppressedWarnings: string[] = [];
          
          console.warn = (...args: unknown[]) => {
            const message = String(args[0] || "");
            // Suppress Google Maps deprecation warnings during initialization
            if (
              message.includes("AutocompleteService is not available to new customers") ||
              message.includes("PlacesService is not available to new customers") ||
              message.includes("google.maps.places.AutocompleteService") ||
              message.includes("google.maps.places.PlacesService")
            ) {
              suppressedWarnings.push(message);
              return; // Suppress this warning
            }
            // Allow other warnings through
            originalWarn.apply(console, args);
          };

          try {
            // Initialize legacy APIs (warnings are suppressed above)
            // These APIs continue to work and will be supported for at least 12 months
            this.autocompleteService = new window.google.maps.places.AutocompleteService();
            this.placesService = new window.google.maps.places.PlacesService(
              document.createElement("div")
            );
            this.isInitialized = true;
            
            // Restore original console.warn
            console.warn = originalWarn;
            
            resolve();
          } catch (error) {
            // Restore original console.warn before logging error
            console.warn = originalWarn;
            console.error("Failed to initialize Google Maps Places services:", error);
            resolve(); // Resolve anyway to prevent hanging
          }
        } else {
          // Retry after a short delay
          setTimeout(checkGoogleMaps, 100);
        }
      };

      checkGoogleMaps();
    });

    return this.initPromise;
  }

  getAutocompleteService(): google.maps.places.AutocompleteService | null {
    return this.autocompleteService;
  }

  getPlacesService(): google.maps.places.PlacesService | null {
    return this.placesService;
  }

  isReady(): boolean {
    return this.isInitialized;
  }
}

export function AddressAutocomplete({
  value,
  onChange,
  onSelect,
  placeholder = "Search for an address anywhere in the world...",
  disabled = false,
  className,
  error = false,
  countryRestriction,
}: AddressAutocompleteProps) {
  const [isOpen, setIsOpen] = useState(false);
  // Ensure inputValue is always a string, never undefined
  const [inputValue, setInputValue] = useState(value ?? "");
  const [suggestions, setSuggestions] = useState<google.maps.places.AutocompletePrediction[]>([]);
  const [isReady, setIsReady] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const placesService = GoogleMapsPlacesService.getInstance();

  // Initialize Google Maps services using singleton pattern
  useEffect(() => {
    placesService.initialize().then(() => {
      setIsReady(placesService.isReady());
    });
  }, [placesService]);

  // Sync external value with internal state
  // Update if the external value is different (including empty string)
  // Always ensure value is a string (never undefined) to avoid controlled/uncontrolled warning
  useEffect(() => {
    const stringValue = value ?? "";
    if (stringValue !== inputValue) {
      setInputValue(stringValue);
    }
  }, [value, inputValue]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    onChange?.(newValue);
    setIsOpen(true);

    // Debounce autocomplete requests
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!isReady || newValue.length < 3) {
      setSuggestions([]);
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      // Use legacy API (deprecation warnings are expected but functionality works)
      const autocompleteService = placesService.getAutocompleteService();
      if (autocompleteService) {
        const request: google.maps.places.AutocompletionRequest = {
          input: newValue,
        };

        if (countryRestriction) {
          request.componentRestrictions = { country: countryRestriction };
        }

        autocompleteService.getPlacePredictions(
          request,
          (predictions, status) => {
            if (
              status === window.google.maps.places.PlacesServiceStatus.OK &&
              predictions
            ) {
              setSuggestions(predictions);
            } else {
              setSuggestions([]);
            }
          }
        );
      }
    }, 300);
  };

  const handleSelect = async (placeId: string, description: string) => {
    // Set the input value immediately to show the selected address
    setInputValue(description);
    setSuggestions([]);
    setIsOpen(false);
    
    // Call onChange with the description first to update the form field
    onChange?.(description);

    // Get place details using legacy API (new API migration pending clearer documentation)
    const placesServiceInstance = placesService.getPlacesService();
    if (isReady && placesServiceInstance) {
      placesServiceInstance.getDetails(
        {
          placeId,
          fields: [
            "address_components",
            "formatted_address",
            "geometry",
            "place_id",
          ],
        },
        (place, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && place) {
            const components = parseAddressComponents(place);
            
            // Use formatted address if street is empty, otherwise use the description
            const displayAddress = components.street || components.formattedAddress || description;
            
            // Ensure input value is set to the display address
            setInputValue(displayAddress);
            
            // Console log for debugging
            console.log("📍 Address Selected:", {
              placeId,
              description,
              formattedAddress: place.formatted_address,
              displayAddress,
              components: {
                street: components.street,
                city: components.city,
                state: components.state,
                zip: components.zip,
                country: components.country,
                coordinates: components.coordinates,
              },
              rawPlaceData: place,
            });
            
            // Call onSelect with components to fill all address fields
            onSelect?.(components);
            // Call onChange again with the display address and components
            onChange?.(displayAddress, components);
          }
        }
      );
    } else {
      // If service is not ready, still update with description
      onChange?.(description);
    }
  };

  const parseAddressComponents = (
    place: google.maps.places.PlaceResult
  ): AddressComponents => {
    const components: AddressComponents = {
      street: "",
      city: "",
      state: "",
      zip: "",
      country: "",
      formattedAddress: place.formatted_address || "",
      placeId: place.place_id,
      coordinates: place.geometry?.location
        ? {
            lat: place.geometry.location.lat(),
            lng: place.geometry.location.lng(),
          }
        : undefined,
    };

    if (place.address_components) {
      let countryCode = "";
      
      // First pass: get country code
      place.address_components.forEach((component) => {
        if (component.types.includes("country")) {
          countryCode = component.short_name.toUpperCase(); // Ensure uppercase
          components.country = component.short_name.toUpperCase();
        }
      });

      // Second pass: parse other components
      place.address_components.forEach((component) => {
        const types = component.types;

        // Street address
        if (types.includes("street_number")) {
          components.street = component.long_name + " ";
        }
        if (types.includes("route")) {
          components.street += component.long_name;
        }
        // Handle subpremise (apartment, suite, etc.)
        if (types.includes("subpremise")) {
          components.street += ", " + component.long_name;
        }

        // City - try multiple types for international support
        if (types.includes("locality")) {
          components.city = component.long_name;
        } else if (types.includes("administrative_area_level_2") && !components.city) {
          components.city = component.long_name;
        } else if (types.includes("postal_town") && !components.city) {
          components.city = component.long_name;
        }

        // State/Province - use long_name for international, short_name for US
        if (types.includes("administrative_area_level_1")) {
          components.state = countryCode === "US" 
            ? component.short_name 
            : component.long_name;
        }

        // Postal code
        if (types.includes("postal_code")) {
          components.zip = component.long_name;
        }

        // Country (already set above, but ensure it's set)
        if (types.includes("country") && !components.country) {
          components.country = component.short_name.toUpperCase();
        }
      });
    }

    return components;
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  const hasSuggestions = suggestions.length > 0;

  return (
    <div ref={containerRef} className="relative w-full">
      <div className="relative">
        <MapPin className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          ref={inputRef}
          value={inputValue ?? ""}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          disabled={disabled || !isReady}
          className={cn(
            "pl-9",
            error && "border-destructive focus-visible:ring-destructive",
            className
          )}
        />
        {!isReady && (
          <Loader2 className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
        )}
      </div>

      {isOpen && hasSuggestions && (
        <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border bg-popover shadow-md">
          {suggestions.map(({ place_id, description }) => (
            <button
              key={place_id}
              type="button"
              onClick={() => handleSelect(place_id, description)}
              className="w-full px-4 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground focus:outline-none"
            >
              {description}
            </button>
          ))}
        </div>
      )}

      {isOpen && inputValue.length >= 3 && !hasSuggestions && (
        <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover px-4 py-2 text-sm text-muted-foreground shadow-md">
          No addresses found
        </div>
      )}
    </div>
  );
}
