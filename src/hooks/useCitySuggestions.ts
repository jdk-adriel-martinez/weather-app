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
  const [selectedSuggestion, setSelectedSuggestion] =
    useState<CitySuggestion | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const [suggestionsState, setSuggestionsState] = useState<SuggestionsState>(
    initialSuggestionsState,
  );
  const fieldRef = useRef<HTMLDivElement | null>(null);
  const skipNextSearchRef = useRef(false);
  const requestControllerRef = useRef<AbortController | null>(null);
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
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  const fetchSuggestions = async (query: string) => {
    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setSuggestionsState({
      items: [],
      status: "loading",
    });

    try {
      const response = await fetch(`/api/cities?q=${encodeURIComponent(query)}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Could not load city suggestions.");
      }

      const data = (await response.json()) as {
        suggestions: CitySuggestion[];
      };

      if (controller.signal.aborted) {
        return null;
      }

      setSuggestionsState({
        items: data.suggestions,
        status: data.suggestions.length > 0 ? "success" : "empty",
      });
      setIsSuggestionsOpen(true);

      return data.suggestions;
    } catch (error) {
      if (controller.signal.aborted) {
        return null;
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

      return null;
    }
  };

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }

    if (debouncedQuery.length < 2) {
      requestControllerRef.current?.abort();
      setSuggestionsState(initialSuggestionsState);
      return;
    }

    void fetchSuggestions(debouncedQuery);
  }, [debouncedQuery]);

  const hasCityText = trimmedCity.length > 0;
  const showSuggestions =
    isSuggestionsOpen &&
    hasCityText &&
    suggestionsState.status !== "idle";

  const handleCityChange = (nextValue: string) => {
    requestControllerRef.current?.abort();
    setCity(nextValue);
    setSelectedSuggestion(null);
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
    setSelectedSuggestion(suggestion);
    setCity(formatCitySuggestionLabel(suggestion));
    setSuggestionsState(initialSuggestionsState);
    setIsSuggestionsOpen(false);
  };

  const findBestSuggestionMatch = (suggestions: CitySuggestion[]) => {
    const normalizedCity = trimmedCity.toLowerCase();

    return (
      suggestions.find((suggestion) => {
        const suggestionLabel = formatCitySuggestionLabel(suggestion).toLowerCase();

        return (
          suggestion.name.toLowerCase() === normalizedCity ||
          suggestionLabel === normalizedCity
        );
      }) ?? suggestions[0]
    );
  };

  const resolveSearchCandidate = async () => {
    if (!hasCityText) {
      return null;
    }

    if (selectedSuggestion) {
      setIsSuggestionsOpen(false);
      return selectedSuggestion;
    }

    if (trimmedCity.length < 2) {
      setSuggestionsState({
        items: [],
        status: "empty",
      });
      setIsSuggestionsOpen(true);
      return null;
    }

    const suggestions =
      suggestionsState.status === "success"
        ? suggestionsState.items
        : await fetchSuggestions(trimmedCity);

    if (!suggestions || suggestions.length === 0) {
      return null;
    }

    const suggestion = findBestSuggestionMatch(suggestions);

    handleSuggestionSelect(suggestion);

    return suggestion;
  };

  return {
    city,
    fieldRef,
    handleCityChange,
    handleCityFocus,
    handleSuggestionSelect,
    hasCityText,
    resolveSearchCandidate,
    showSuggestions,
    suggestionsState,
  };
}
