import { useEffect, useRef, useState } from "react";

import styles from "./WeatherPanel.module.css";

type CitySuggestion = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  state?: string;
};

const formatSuggestionLabel = (suggestion: CitySuggestion) => {
  const locationParts = [suggestion.state, suggestion.country].filter(Boolean);

  if (locationParts.length === 0) {
    return suggestion.name;
  }

  return `${suggestion.name}, ${locationParts.join(", ")}`;
};

export function WeatherPanel() {
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<CitySuggestion[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);
  const [suggestionsError, setSuggestionsError] = useState<string | null>(null);
  const [isSuggestionsOpen, setIsSuggestionsOpen] = useState(false);
  const fieldRef = useRef<HTMLDivElement | null>(null);

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
    const query = city.trim();

    if (query.length < 2) {
      setSuggestions([]);
      setIsLoadingSuggestions(false);
      setSuggestionsError(null);
      setIsSuggestionsOpen(false);
      return;
    }

    const controller = new AbortController();
    let ignoreResponse = false;

    const timeoutId = window.setTimeout(async () => {
      setIsLoadingSuggestions(true);
      setSuggestionsError(null);

      try {
        const response = await fetch(
          `/api/cities?q=${encodeURIComponent(query)}`,
          { signal: controller.signal },
        );

        if (!response.ok) {
          throw new Error("Could not load city suggestions.");
        }

        const data = (await response.json()) as {
          error?: string;
          suggestions: CitySuggestion[];
        };

        if (!ignoreResponse) {
          setSuggestions(data.suggestions);
          setIsSuggestionsOpen(true);
        }
      } catch (error) {
        if (controller.signal.aborted) {
          return;
        }

        if (!ignoreResponse) {
          setSuggestions([]);
          setSuggestionsError(
            error instanceof Error
              ? error.message
              : "Could not load city suggestions.",
          );
          setIsSuggestionsOpen(true);
        }
      } finally {
        if (!ignoreResponse) {
          setIsLoadingSuggestions(false);
        }
      }
    }, 500);

    return () => {
      ignoreResponse = true;
      controller.abort();
      window.clearTimeout(timeoutId);
    };
  }, [city]);

  const showSuggestions =
    isSuggestionsOpen &&
    city.trim().length >= 2 &&
    (isLoadingSuggestions ||
      suggestions.length > 0 ||
      suggestionsError !== null);

  return (
    <main className={styles["weather-app"]}>
      <section className={styles["weather-app__card"]}>
        <header className={styles["weather-app__header"]}>
          <h1 className={styles["weather-app__title"]}>Clima actual</h1>
          <p className={styles["weather-app__subtitle"]}>
            Consulta el clima de una ciudad.
          </p>
        </header>

        <form className={styles["weather-app__form"]}>
          <label className={styles["weather-app__label"]} htmlFor="city">
            Ciudad
          </label>
          <div className={styles["weather-app__controls"]}>
            <div className={styles["weather-app__field"]} ref={fieldRef}>
              <input
                autoComplete="off"
                className={styles["weather-app__input"]}
                id="city"
                name="city"
                onChange={(event) => {
                  setCity(event.target.value);
                  setIsSuggestionsOpen(event.target.value.trim().length >= 2);
                }}
                onFocus={() => {
                  if (city.trim().length >= 2) {
                    setIsSuggestionsOpen(true);
                  }
                }}
                placeholder="Ej. San Salvador"
                type="text"
                value={city}
              />

              {showSuggestions ? (
                <div className={styles["weather-app__suggestions"]}>
                  {isLoadingSuggestions ? (
                    <p className={styles["weather-app__suggestion-status"]}>
                      Buscando coincidencias...
                    </p>
                  ) : null}

                  {!isLoadingSuggestions && suggestionsError ? (
                    <p className={styles["weather-app__suggestion-status"]}>
                      {suggestionsError}
                    </p>
                  ) : null}

                  {!isLoadingSuggestions &&
                  !suggestionsError &&
                  suggestions.length === 0 ? (
                    <p className={styles["weather-app__suggestion-status"]}>
                      No se encontraron coincidencias.
                    </p>
                  ) : null}

                  {!isLoadingSuggestions && suggestions.length > 0 ? (
                    <ul className={styles["weather-app__suggestion-list"]}>
                      {suggestions.map((suggestion) => {
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
                              onClick={() => {
                                setCity(formatSuggestionLabel(suggestion));
                                setSuggestions([]);
                                setSuggestionsError(null);
                                setIsSuggestionsOpen(false);
                              }}
                              type="button"
                            >
                              {formatSuggestionLabel(suggestion)}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  ) : null}
                </div>
              ) : null}
            </div>

            <button className={styles["weather-app__button"]} type="button">
              Buscar
            </button>
          </div>
        </form>

        <section
          aria-label="Resultado del clima"
          className={styles["weather-app__result"]}
        >
          <h2 className={styles["weather-app__result-title"]}>Resultado</h2>

          <div className={styles["weather-app__row"]}>
            <span className={styles["weather-app__term"]}>Temperatura</span>
            <span className={styles["weather-app__value"]}>--</span>
          </div>

          <div className={styles["weather-app__row"]}>
            <span className={styles["weather-app__term"]}>Humedad</span>
            <span className={styles["weather-app__value"]}>--</span>
          </div>

          <div className={styles["weather-app__row"]}>
            <span className={styles["weather-app__term"]}>Descripcion</span>
            <span className={styles["weather-app__value"]}>--</span>
          </div>

          <p className={styles["weather-app__empty"]}>
            Todavia no hay datos cargados.
          </p>
        </section>
      </section>
    </main>
  );
}
