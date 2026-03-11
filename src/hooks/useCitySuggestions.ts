import { useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CitySuggestion } from "@/services/weather";
import { formatCitySuggestionLabel } from "@/utils/formatCitySuggestionLabel";

export type SuggestionsState =
  | {
      items: CitySuggestion[];
      status: "idle" | "loading" | "success" | "empty";
    }
  | {
      items: [];
      message: string;
      status: "error";
    };

const initialSuggestionsState: SuggestionsState = {
  items: [],
  status: "idle",
};

export function useCitySuggestions() {
  const [city, setCity] = useState("");
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>(
    initialSuggestionsState,
  );
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const skipNextSearchRef = useRef(false);
  const trimmedCity = city.trim();
  const debouncedQuery = useDebouncedValue(trimmedCity, 500);

  useEffect(() => {
    const handlePointerDown = (event: MouseEvent) => {
      if (!fieldRef.current?.contains(event.target as Node)) {
        setIsSuggestionsOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, []);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (debouncedQuery.length < 2) {
      setSuggestionsState(initialSuggestionsState);
      return;
    }

    const controller = new AbortController();
    let isCancelled = false;

    const loadSuggestions = async () => {
      setSuggestionsState({
        items: [],
        status: "loading",
      });

      try {
        const response = await fetch(
          `/api/cities?q=${encodeURIComponent(debouncedQuery)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Could not load city suggestions.");
        }

        const data = (await response.json()) as {
          suggestions: CitySuggestion[];
        };

        if (isCancelled) {
          return;
        }

        setSuggestionsState({
          items: data.suggestions,
          status: data.suggestions.length > 0 ? "success" : "empty",
        });
        setIsSuggestionsOpen(true);
      } catch (error) {
        if (controller.signal.aborted || isCancelled) {
          return;
        }

        setSuggestionsState({
          items: [],
          message:
            error instanceof Error
              ? error.message
              : "Could not load city suggestions.",
          status: "error",
        });
        setIsSuggestionsOpen(true);
      }
    };

    void loadSuggestions();

    return () => {
      isCancelled = true;
      controller.abort();
    };
  }, [debouncedQuery]);

  const hasCityText = trimmedCity.length > 0;
  const showSuggestions =
    isSuggestionsOpen &&
    hasCityText &&
    suggestionsState.status !== "idle";

  const handleCityChange = (nextValue: string) => {
    setCity(nextValue);
    setSuggestionsState(initialSuggestionsState);
    setIsSuggestionsOpen(nextValue.trim().length > 0);
  };

  const handleCityFocus = () => {
    if (trimmedCity.length > 0 && suggestionsState.status !== "idle") {
      setIsSuggestionsOpen(true);
    }
  };

  const handleSuggestionSelect = (suggestion: CitySuggestion) => {
    skipNextSearchRef.current = true;
    setCity(formatCitySuggestionLabel(suggestion));
    setSuggestionsState(initialSuggestionsState);
    setIsSuggestionsOpen(false);
  };

  const handleSearchClick = () => {
    if (!hasCityText || suggestionsState.status === "loading") {
      return;
    }

    if (suggestionsState.status === "idle") {
      setSuggestionsState({
        items: [],
        status: "empty",
      });
    }

    setIsSuggestionsOpen(true);
  };

  return {
    city,
    fieldRef,
    handleCityChange,
    handleCityFocus,
    handleSearchClick,
    handleSuggestionSelect,
    hasCityText,
    showSuggestions,
    suggestionsState,
  };
}
