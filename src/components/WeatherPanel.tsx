import type { FormEvent } from "react";

import { CitySuggestions } from "@/components/CitySuggestions";
import {
  CITY_NOT_FOUND_MESSAGE,
  useCitySuggestions,
} from "@/hooks/useCitySuggestions";
import { useCurrentWeather } from "@/hooks/useCurrentWeather";

import styles from "./WeatherPanel.module.css";

export function WeatherPanel() {
  const {
    city,
    fieldRef,
    handleCityChange,
    handleCityFocus,
    handleSuggestionSelect,
    hasCityText,
    resolveSearchCandidate,
    showSuggestions,
    suggestionsState,
  } = useCitySuggestions();
  const { loadWeather, setWeatherError, weatherState } = useCurrentWeather();

  const handleSuggestionSelectAndLoadWeather = (suggestion: Parameters<
    typeof handleSuggestionSelect
  >[0]) => {
    handleSuggestionSelect(suggestion);
    void loadWeather(suggestion);
  };

  const handleSearchButtonClick = async () => {
    const searchCandidateResult = await resolveSearchCandidate();

    if (searchCandidateResult.status === "aborted") {
      return;
    }

    if (searchCandidateResult.status !== "resolved") {
      setWeatherError(searchCandidateResult.message);
      return;
    }

    void loadWeather(searchCandidateResult.suggestion);
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!hasCityText) {
      return;
    }

    void handleSearchButtonClick();
  };

  const isNotFoundError =
    weatherState.status === "error" &&
    weatherState.message === CITY_NOT_FOUND_MESSAGE;

  return (
    <main className={styles["weather-app"]}>
      <section className={styles["weather-app__card"]}>
        <header className={styles["weather-app__header"]}>
          <h1 className={styles["weather-app__title"]}>Clima actual</h1>
          <p className={styles["weather-app__subtitle"]}>
            Consulta el clima de una ciudad.
          </p>
        </header>

        <form
          className={styles["weather-app__form"]}
          onSubmit={handleSearchSubmit}
        >
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
                onChange={(event) => handleCityChange(event.target.value)}
                onFocus={handleCityFocus}
                placeholder="Ej. San Salvador"
                type="text"
                value={city}
              />

              {showSuggestions ? (
                <CitySuggestions
                  onSelect={handleSuggestionSelectAndLoadWeather}
                  suggestionsState={suggestionsState}
                />
              ) : null}
            </div>

            <button
              className={styles["weather-app__button"]}
              disabled={!hasCityText}
              type="submit"
            >
              Buscar
            </button>
          </div>
        </form>

        {weatherState.status === "success" ? (
          <section
            aria-label="Resultado del clima"
            className={styles["weather-app__result"]}
          >
            <h2 className={styles["weather-app__result-title"]}>Resultado</h2>

            <div className={styles["weather-app__row"]}>
              <span className={styles["weather-app__term"]}>Temperatura</span>
              <span className={styles["weather-app__value"]}>
                {Math.round(weatherState.weather.temperature)} C
              </span>
            </div>

            <div className={styles["weather-app__row"]}>
              <span className={styles["weather-app__term"]}>Humedad</span>
              <span className={styles["weather-app__value"]}>
                {weatherState.weather.humidity}%
              </span>
            </div>

            <div className={styles["weather-app__row"]}>
              <span className={styles["weather-app__term"]}>Descripcion</span>
              <span className={styles["weather-app__value"]}>
                {weatherState.weather.description}
              </span>
            </div>

            <p className={styles["weather-app__result-summary"]}>
              Consulta actual: {weatherState.weather.city}.
            </p>
          </section>
        ) : weatherState.status === "error" ? (
          <section
            aria-label="Estado de error"
            aria-live="polite"
            className={styles["weather-app__result"]}
          >
            <div
              className={`${styles["weather-app__state"]} ${styles["weather-app__state--error"]}`}
            >
              <h2 className={styles["weather-app__state-title"]}>
                {isNotFoundError
                  ? "No se encontro la ciudad"
                  : "No pudimos completar la busqueda"}
              </h2>
              <p className={styles["weather-app__state-copy"]}>
                {weatherState.message}
              </p>
              <p className={styles["weather-app__state-copy"]}>
                {isNotFoundError
                  ? "Prueba con otro nombre o elige una coincidencia del listado."
                  : "Intenta nuevamente en unos segundos."}
              </p>
            </div>
          </section>
        ) : (
          <section
            aria-label="Estado inicial"
            aria-live="polite"
            className={styles["weather-app__result"]}
          >
            <div className={styles["weather-app__state"]}>
              <h2 className={styles["weather-app__state-title"]}>
                {weatherState.status === "loading"
                  ? "Buscando el clima"
                  : "Haz una busqueda"}
              </h2>
              <p className={styles["weather-app__state-copy"]}>
                {weatherState.status === "loading"
                  ? "Estamos consultando el clima actual para mostrarte los datos mas recientes."
                  : "Escribe una ciudad y presiona Buscar para ver temperatura, humedad y descripcion."}
              </p>
            </div>
          </section>
        )}
      </section>
    </main>
  );
}
