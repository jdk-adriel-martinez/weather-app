import { CitySuggestions } from "@/components/CitySuggestions";
import { useCitySuggestions } from "@/hooks/useCitySuggestions";

import styles from "./WeatherPanel.module.css";

const weatherResultItems = ["Temperatura", "Humedad", "Descripcion"];

export function WeatherPanel() {
  const {
    city,
    fieldRef,
    handleCityChange,
    handleCityFocus,
    handleSearchClick,
    handleSuggestionSelect,
    hasCityText,
    showSuggestions,
    suggestionsState,
  } = useCitySuggestions();

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
                  onSelect={handleSuggestionSelect}
                  suggestionsState={suggestionsState}
                />
              ) : null}
            </div>

            <button
              className={styles["weather-app__button"]}
              disabled={!hasCityText}
              onClick={handleSearchClick}
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
            <div className={styles["weather-app__row"]} key={label}>
              <span className={styles["weather-app__term"]}>{label}</span>
              <span className={styles["weather-app__value"]}>--</span>
            </div>
          ))}

          <p className={styles["weather-app__empty"]}>
            Todavia no hay datos cargados.
          </p>
        </section>
      </section>
    </main>
  );
}
