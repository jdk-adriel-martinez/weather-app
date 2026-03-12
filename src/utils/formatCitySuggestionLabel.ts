import type { CitySuggestion } from "@/services/weather";

export function formatCitySuggestionLabel(suggestion: CitySuggestion) {
  const locationParts = [suggestion.state, suggestion.country].filter(Boolean);

  if (locationParts.length === 0) {
    return suggestion.name;
  }

  return `${suggestion.name}, ${locationParts.join(", ")}`;
}
