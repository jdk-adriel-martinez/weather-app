export type CitySuggestion = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  state?: string;
};

type OpenWeatherCityResult = {
  country: string;
  lat: number;
  lon: number;
  name: string;
  state?: string;
};

const OPEN_WEATHER_GEOCODING_URL =
  "https://api.openweathermap.org/geo/1.0/direct";

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
