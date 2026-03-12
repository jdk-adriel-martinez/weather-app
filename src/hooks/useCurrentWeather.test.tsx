import { act, renderHook, waitFor } from "@testing-library/react";

import type { CitySuggestion } from "@/services/weather";
import { useCurrentWeather } from "@/hooks/useCurrentWeather";

function createDeferred<T>() {
  let reject!: (reason?: unknown) => void;
  let resolve!: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((innerResolve, innerReject) => {
    resolve = innerResolve;
    reject = innerReject;
  });

  return {
    promise,
    reject,
    resolve,
  };
}

describe("useCurrentWeather", () => {
  const city: CitySuggestion = {
    country: "SV",
    lat: 13.6929,
    lon: -89.2182,
    name: "San Salvador",
    state: "San Salvador",
  };

  beforeEach(() => {
    jest.restoreAllMocks();
  });

  it("loads weather successfully", async () => {
    const deferredResponse = createDeferred<Response>();

    jest.spyOn(global, "fetch").mockReturnValue(deferredResponse.promise);

    const { result } = renderHook(() => useCurrentWeather());

    act(() => {
      void result.current.loadWeather(city);
    });

    expect(result.current.weatherState).toEqual({
      status: "loading",
      weather: null,
    });

    deferredResponse.resolve(
      new Response(
        JSON.stringify({
          weather: {
            city: "San Salvador",
            description: "nubes dispersas",
            humidity: 74,
            temperature: 27.4,
          },
        }),
        {
          status: 200,
        },
      ),
    );

    await waitFor(() => {
      expect(result.current.weatherState).toEqual({
        status: "success",
        weather: {
          city: "San Salvador",
          description: "nubes dispersas",
          humidity: 74,
          temperature: 27.4,
        },
      });
    });
  });

  it("stores an error when the API response is not valid", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          error: "No weather payload.",
        }),
        {
          status: 200,
        },
      ),
    );

    const { result } = renderHook(() => useCurrentWeather());

    await act(async () => {
      await result.current.loadWeather(city);
    });

    expect(result.current.weatherState).toEqual({
      message: "No weather payload.",
      status: "error",
      weather: null,
    });
  });

  it("stores a generic error when the request fails", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 500,
      }),
    );

    const { result } = renderHook(() => useCurrentWeather());

    await act(async () => {
      await result.current.loadWeather(city);
    });

    expect(result.current.weatherState).toEqual({
      message: "Could not load current weather.",
      status: "error",
      weather: null,
    });
  });

  it("aborts the active request when setting a manual error", () => {
    const deferredResponse = createDeferred<Response>();
    const fetchSpy = jest.spyOn(global, "fetch").mockImplementation(
      (_input, init) => {
        expect(init?.signal).toBeInstanceOf(AbortSignal);
        return deferredResponse.promise;
      },
    );

    const { result } = renderHook(() => useCurrentWeather());

    act(() => {
      void result.current.loadWeather(city);
    });

    const activeSignal = fetchSpy.mock.calls[0]?.[1]?.signal;

    act(() => {
      result.current.setWeatherError("No se encontro la ciudad.");
    });

    expect(activeSignal?.aborted).toBe(true);
    expect(result.current.weatherState).toEqual({
      message: "No se encontro la ciudad.",
      status: "error",
      weather: null,
    });
  });
});
