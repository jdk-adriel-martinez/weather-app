import styles from "./WeatherPanel.module.css";

export function WeatherPanel() {
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
          <div className={styles["weather-app__actions"]}>
            <input
              className={styles["weather-app__input"]}
              id="city"
              name="city"
              placeholder="Ej. San Salvador"
              type="text"
            />
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
