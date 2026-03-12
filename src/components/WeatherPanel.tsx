import { CitySuggestions } from "@/components/CitySuggestions";
import { useCitySuggestions } from "@/hooks/useCitySuggestions";
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
  const { loadWeather, weatherState } = useCurrentWeather();

  const handleSuggestionSelectAndLoadWeather = (suggestion: Parameters<
    typeof handleSuggestionSelect
  >[0]) => {
    handleSuggestionSelect(suggestion);
    void loadWeather(suggestion);
  };

  const handleSearchButtonClick = async () => {
    const cityCandidate = await resolveSearchCandidate();

    if (!cityCandidate) {
      return;
    }

    void loadWeather(cityCandidate);
  };

  const weatherResultItems = [
    {
      label: "Temperatura",
      value:
        weatherState.status === "success"
          ? `${Math.round(weatherState.weather.temperature)} C`
          : "--",
    },
    {
      label: "Humedad",
      value:
        weatherState.status === "success"
          ? `${weatherState.weather.humidity}%`
          : "--",
    },
    {
      label: "Descripcion",
      value:
        weatherState.status === "success"
          ? weatherState.weather.description
          : "--",
    },
  ];

  const weatherStatusMessage =
    weatherState.status === "idle"
      ? "Todavia no hay datos cargados."
      : weatherState.status === "loading"
        ? "Cargando clima..."
        : weatherState.status === "error"
          ? weatherState.message
          : `Consulta actual: ${weatherState.weather.city}.`;

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
              onClick={() => {
                void handleSearchButtonClick();
              }}
              type="button"
            >
              Buscar
            </button>
          </div>
        </form>

        <section
          aria-label="Resultado del clima"
          className={styles["weather-app__result"]}
        >
          <h2 className={styles["weather-app__result-title"]}>Resultado</h2>

          {weatherResultItems.map((label) => (
            <div className={styles["weather-app__row"]} key={label.label}>
              <span className={styles["weather-app__term"]}>{label.label}</span>
              <span className={styles["weather-app__value"]}>{label.value}</span>
            </div>
          ))}

          <p className={styles["weather-app__empty"]}>
            {weatherStatusMessage}
          </p>
        </section>
      </section>
    </main>
  );
}
