import type { SuggestionsState } from "@/hooks/useCitySuggestions";
import type { CitySuggestion } from "@/services/weather";
import { formatCitySuggestionLabel } from "@/utils/formatCitySuggestionLabel";

import styles from "./WeatherPanel.module.css";

type CitySuggestionsProps = {
  onSelect: (suggestion: CitySuggestion) => void;
  suggestionsState: SuggestionsState;
};

export function CitySuggestions({
  onSelect,
  suggestionsState,
}: CitySuggestionsProps) {
  return (
    <div className={styles["weather-app__suggestions"]}>
      {suggestionsState.status === "loading" ? (
        <p className={styles["weather-app__suggestion-status"]}>
          Buscando coincidencias...
        </p>
      ) : null}

      {suggestionsState.status === "error" ? (
        <p className={styles["weather-app__suggestion-status"]}>
          {suggestionsState.message}
        </p>
      ) : null}

      {suggestionsState.status === "empty" ? (
        <p className={styles["weather-app__suggestion-status"]}>
          No se encontraron resultados.
        </p>
      ) : null}

      {suggestionsState.status === "success" ? (
        <ul className={styles["weather-app__suggestion-list"]}>
          {suggestionsState.items.map((suggestion) => {
            const suggestionKey = [
              suggestion.name,
              suggestion.state,
              suggestion.country,
              suggestion.lat,
              suggestion.lon,
            ].join("-");

            return (
              <li key={suggestionKey}>
                <button
                  className={styles["weather-app__suggestion"]}
                  onClick={() => onSelect(suggestion)}
                  type="button"
                >
                  {formatCitySuggestionLabel(suggestion)}
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}
    </div>
  );
}
