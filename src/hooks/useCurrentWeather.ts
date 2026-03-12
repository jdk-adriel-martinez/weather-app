import { useEffect, useRef, useState } from "react";

import type { CitySuggestion, CurrentWeather } from "@/services/weather";

type WeatherState =
  | {
      status: "idle" | "loading";
      weather: null;
    }
  | {
      status: "success";
      weather: CurrentWeather;
    }
  | {
      message: string;
      status: "error";
      weather: null;
    };

const initialWeatherState: WeatherState = {
  status: "idle",
  weather: null,
};

export function useCurrentWeather() {
  const [weatherState, setWeatherState] = useState<WeatherState>(
    initialWeatherState,
  );
  const requestControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    return () => {
      requestControllerRef.current?.abort();
    };
  }, []);

  const loadWeather = async (city: CitySuggestion) => {
    requestControllerRef.current?.abort();

    const controller = new AbortController();
    requestControllerRef.current = controller;

    setWeatherState({
      status: "loading",
      weather: null,
    });

    try {
      const params = new URLSearchParams({
        lat: String(city.lat),
        lon: String(city.lon),
      });

      const response = await fetch(`/api/weather?${params}`, {
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error("Could not load current weather.");
      }

      const data = (await response.json()) as {
        error?: string;
        weather?: CurrentWeather;
      };

      if (!data.weather) {
        throw new Error(data.error ?? "Could not load current weather.");
      }

      setWeatherState({
        status: "success",
        weather: data.weather,
      });
    } catch (error) {
      if (controller.signal.aborted) {
        return;
      }

      setWeatherState({
        message:
          error instanceof Error
            ? error.message
            : "Could not load current weather.",
        status: "error",
        weather: null,
      });
    }
  };

  const setWeatherError = (message: string) => {
    requestControllerRef.current?.abort();

    setWeatherState({
      message,
      status: "error",
      weather: null,
    });
  };

  return {
    loadWeather,
    setWeatherError,
    weatherState,
  };
}
