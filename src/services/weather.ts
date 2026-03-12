export type CitySuggestion = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  state?: string;
};

export type CurrentWeather = {
  city: string;
  description: string;
  humidity: number;
  temperature: number;
};

type OpenWeatherCityResult = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  state?: string;
};

type OpenWeatherCurrentWeatherResult = {
  main: {
    humidity: number;
    temp: number;
  };
  name: string;
  weather: Array<{
    description: string;
  }>;
};

const OPEN_WEATHER_GEOCODING_URL =
  "https://api.openweathermap.org/geo/1.0/direct";
const OPEN_WEATHER_CURRENT_WEATHER_URL =
  "https://api.openweathermap.org/data/2.5/weather";

export const getWeatherApiKey = () =>
  process.env.OPENWEATHER_API_KEY ?? process.env.WEATHER_API_KEY;

export async function searchCitiesByName(query: string) {
  const apiKey = getWeatherApiKey();

  if (!apiKey) {
    throw new Error("Weather API key is not configured.");
  }

  const params = new URLSearchParams({
    appid: apiKey,
    limit: "3",
    q: query,
  });

  const response = await fetch(`${OPEN_WEATHER_GEOCODING_URL}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch city suggestions.");
  }

  const data = (await response.json()) as OpenWeatherCityResult[];

  return data.map((city) => ({
    country: city.country,
    lat: city.lat,
    lon: city.lon,
    name: city.name,
    state: city.state,
  })) satisfies CitySuggestion[];
}

export async function getCurrentWeatherByCoordinates({
  lat,
  lon,
}: Pick<CitySuggestion, "lat" | "lon">) {
  const apiKey = getWeatherApiKey();

  if (!apiKey) {
    throw new Error("Weather API key is not configured.");
  }

  const params = new URLSearchParams({
    appid: apiKey,
    lang: "es",
    lat: String(lat),
    lon: String(lon),
    units: "metric",
  });

  const response = await fetch(`${OPEN_WEATHER_CURRENT_WEATHER_URL}?${params}`);

  if (!response.ok) {
    throw new Error("Failed to fetch current weather.");
  }

  const data = (await response.json()) as OpenWeatherCurrentWeatherResult;

  return {
    city: data.name,
    description: data.weather[0]?.description ?? "Sin descripcion",
    humidity: data.main.humidity,
    temperature: data.main.temp,
  } satisfies CurrentWeather;
}
