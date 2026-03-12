import {
  getCurrentWeatherByCoordinates,
  getWeatherApiKey,
  searchCitiesByName,
} from "@/services/weather";

describe("weather service", () => {
  const originalOpenWeatherApiKey = process.env.OPENWEATHER_API_KEY;
  const originalWeatherApiKey = process.env.WEATHER_API_KEY;

  beforeEach(() => {
    jest.restoreAllMocks();
    delete process.env.OPENWEATHER_API_KEY;
    delete process.env.WEATHER_API_KEY;
  });

  afterAll(() => {
    process.env.OPENWEATHER_API_KEY = originalOpenWeatherApiKey;
    process.env.WEATHER_API_KEY = originalWeatherApiKey;
  });

  it("prefers OPENWEATHER_API_KEY over WEATHER_API_KEY", () => {
    process.env.OPENWEATHER_API_KEY = "preferred-key";
    process.env.WEATHER_API_KEY = "fallback-key";

    expect(getWeatherApiKey()).toBe("preferred-key");
  });

  it("uses WEATHER_API_KEY as a fallback", () => {
    process.env.WEATHER_API_KEY = "fallback-key";

    expect(getWeatherApiKey()).toBe("fallback-key");
  });

  it("throws when searching cities without an API key", async () => {
    await expect(searchCitiesByName("San Salvador")).rejects.toThrow(
      "Weather API key is not configured.",
    );
  });

  it("maps city suggestions from OpenWeather", async () => {
    process.env.OPENWEATHER_API_KEY = "test-key";

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify([
          {
            country: "SV",
            lat: 13.6929,
            lon: -89.2182,
            name: "San Salvador",
            state: "San Salvador",
          },
        ]),
        {
          status: 200,
        },
      ),
    );

    await expect(searchCitiesByName("San Salvador")).resolves.toEqual([
      {
        country: "SV",
        lat: 13.6929,
        lon: -89.2182,
        name: "San Salvador",
        state: "San Salvador",
      },
    ]);
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://api.openweathermap.org/geo/1.0/direct?"),
    );
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("limit=3"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("q=San+Salvador"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("appid=test-key"));
  });

  it("throws when city suggestions request fails", async () => {
    process.env.OPENWEATHER_API_KEY = "test-key";

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 500,
      }),
    );

    await expect(searchCitiesByName("San Salvador")).rejects.toThrow(
      "Failed to fetch city suggestions.",
    );
  });

  it("throws when loading weather without an API key", async () => {
    await expect(
      getCurrentWeatherByCoordinates({
        lat: 13.6929,
        lon: -89.2182,
      }),
    ).rejects.toThrow("Weather API key is not configured.");
  });

  it("maps current weather data from OpenWeather", async () => {
    process.env.OPENWEATHER_API_KEY = "test-key";

    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          main: {
            humidity: 74,
            temp: 27.4,
          },
          name: "San Salvador",
          weather: [
            {
              description: "nubes dispersas",
            },
          ],
        }),
        {
          status: 200,
        },
      ),
    );

    await expect(
      getCurrentWeatherByCoordinates({
        lat: 13.6929,
        lon: -89.2182,
      }),
    ).resolves.toEqual({
      city: "San Salvador",
      description: "nubes dispersas",
      humidity: 74,
      temperature: 27.4,
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      expect.stringContaining("https://api.openweathermap.org/data/2.5/weather?"),
    );
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("units=metric"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("lang=es"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("lat=13.6929"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("lon=-89.2182"));
    expect(fetchSpy).toHaveBeenCalledWith(expect.stringContaining("appid=test-key"));
  });

  it("uses a fallback description when weather details are missing", async () => {
    process.env.OPENWEATHER_API_KEY = "test-key";

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          main: {
            humidity: 74,
            temp: 27.4,
          },
          name: "San Salvador",
          weather: [],
        }),
        {
          status: 200,
        },
      ),
    );

    await expect(
      getCurrentWeatherByCoordinates({
        lat: 13.6929,
        lon: -89.2182,
      }),
    ).resolves.toEqual({
      city: "San Salvador",
      description: "Sin descripcion",
      humidity: 74,
      temperature: 27.4,
    });
  });

  it("throws when current weather request fails", async () => {
    process.env.OPENWEATHER_API_KEY = "test-key";

    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 500,
      }),
    );

    await expect(
      getCurrentWeatherByCoordinates({
        lat: 13.6929,
        lon: -89.2182,
      }),
    ).rejects.toThrow("Failed to fetch current weather.");
  });
});
