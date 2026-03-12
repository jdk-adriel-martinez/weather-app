import { useEffect, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/useDebouncedValue";
import type { CitySuggestion } from "@/services/weather";
import { formatCitySuggestionLabel } from "@/utils/formatCitySuggestionLabel";

export const CITY_NOT_FOUND_MESSAGE =
  "No se encontro ninguna ciudad que coincida con la busqueda.";

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

type FetchSuggestionsResult =
  | {
      status: "success" | "empty";
      suggestions: CitySuggestion[];
    }
  | {
      status: "error";
      message: string;
    }
  | {
      status: "aborted";
    };

type SearchCandidateResult =
  | {
      status: "resolved";
      suggestion: CitySuggestion;
    }
  | {
      status: "empty" | "error";
      message: string;
    }
  | {
      status: "aborted";
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

  const fetchSuggestions = async (
    query: string,
  ): Promise<FetchSuggestionsResult> => {
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
        return {
          status: "aborted",
        };
      }

      const nextStatus = data.suggestions.length > 0 ? "success" : "empty";

      setSuggestionsState({
        items: data.suggestions,
        status: nextStatus,
      });
      setIsSuggestionsOpen(true);

      return {
        status: nextStatus,
        suggestions: data.suggestions,
      };
    } catch (error) {
      if (controller.signal.aborted) {
        return {
          status: "aborted",
        };
      }

      const message =
        error instanceof Error
          ? error.message
          : "Could not load city suggestions.";

      setSuggestionsState({
        items: [],
        message,
        status: "error",
      });
      setIsSuggestionsOpen(true);

      return {
        status: "error",
        message,
      };
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

  const resolveSearchCandidate = async (): Promise<SearchCandidateResult> => {
    if (!hasCityText) {
      return {
        message: CITY_NOT_FOUND_MESSAGE,
        status: "empty",
      };
    }

    if (selectedSuggestion) {
      setIsSuggestionsOpen(false);
      return {
        status: "resolved",
        suggestion: selectedSuggestion,
      };
    }

    if (trimmedCity.length < 2) {
      setSuggestionsState({
        items: [],
        status: "empty",
      });
      setIsSuggestionsOpen(true);
      return {
        message: CITY_NOT_FOUND_MESSAGE,
        status: "empty",
      };
    }

    const suggestionsResult =
      suggestionsState.status === "success"
        ? {
            status: "success" as const,
            suggestions: suggestionsState.items,
          }
        : await fetchSuggestions(trimmedCity);

    if (suggestionsResult.status === "aborted") {
      return {
        status: "aborted",
      };
    }

    if (suggestionsResult.status === "error") {
      return {
        message: suggestionsResult.message,
        status: "error",
      };
    }

    if (suggestionsResult.suggestions.length === 0) {
      return {
        message: CITY_NOT_FOUND_MESSAGE,
        status: "empty",
      };
    }

    const suggestion = findBestSuggestionMatch(suggestionsResult.suggestions);

    handleSuggestionSelect(suggestion);

    return {
      status: "resolved",
      suggestion,
    };
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
