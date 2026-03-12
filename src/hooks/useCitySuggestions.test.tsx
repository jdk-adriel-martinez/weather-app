import { act, renderHook, waitFor } from "@testing-library/react";

import {
  CITY_NOT_FOUND_MESSAGE,
  useCitySuggestions,
} from "@/hooks/useCitySuggestions";

describe("useCitySuggestions", () => {
  const suggestions = [
    {
      country: "SV",
      lat: 13.7001,
      lon: -89.1919,
      name: "Santa Tecla",
      state: "La Libertad",
    },
    {
      country: "SV",
      lat: 13.6929,
      lon: -89.2182,
      name: "San Salvador",
      state: "San Salvador",
    },
  ];

  beforeEach(() => {
    jest.restoreAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
    jest.useRealTimers();
  });

  it("loads suggestions after the debounce delay", async () => {
    const fetchSpy = jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions,
        }),
        {
          status: 200,
        },
      ),
    );

    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("San Salvador");
    });

    expect(result.current.city).toBe("San Salvador");
    expect(result.current.hasCityText).toBe(true);
    expect(result.current.showSuggestions).toBe(false);

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.suggestionsState).toEqual({
        items: suggestions,
        status: "success",
      });
    });

    expect(fetchSpy).toHaveBeenCalledWith("/api/cities?q=San%20Salvador", {
      signal: expect.any(AbortSignal),
    });
    expect(result.current.showSuggestions).toBe(true);
  });

  it("formats the selected suggestion and closes the list", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions,
        }),
        {
          status: 200,
        },
      ),
    );

    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("San Salvador");
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.suggestionsState.status).toBe("success");
    });

    act(() => {
      result.current.handleSuggestionSelect(suggestions[1]!);
    });

    expect(result.current.city).toBe("San Salvador, San Salvador, SV");
    expect(result.current.showSuggestions).toBe(false);
    expect(result.current.suggestionsState).toEqual({
      items: [],
      status: "idle",
    });
  });

  it("reuses the selected suggestion during search resolution", async () => {
    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("San Salvador");
      result.current.handleSuggestionSelect(suggestions[1]!);
    });

    let searchResult:
      | Awaited<ReturnType<typeof result.current.resolveSearchCandidate>>
      | undefined;

    await act(async () => {
      searchResult = await result.current.resolveSearchCandidate();
    });

    expect(searchResult).toEqual({
      status: "resolved",
      suggestion: suggestions[1],
    });
    expect(result.current.showSuggestions).toBe(false);
  });

  it("picks the best exact suggestion match when resolving a search", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          suggestions,
        }),
        {
          status: 200,
        },
      ),
    );

    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("san salvador");
      jest.advanceTimersByTime(500);
    });

    await waitFor(() => {
      expect(result.current.suggestionsState.status).toBe("success");
    });

    let searchResult:
      | Awaited<ReturnType<typeof result.current.resolveSearchCandidate>>
      | undefined;

    await act(async () => {
      searchResult = await result.current.resolveSearchCandidate();
    });

    expect(searchResult).toEqual({
      status: "resolved",
      suggestion: suggestions[1],
    });
    expect(result.current.city).toBe("San Salvador, San Salvador, SV");
    expect(result.current.suggestionsState).toEqual({
      items: [],
      status: "idle",
    });
  });

  it("returns an empty result for too-short city names", async () => {
    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("S");
    });

    let searchResult:
      | Awaited<ReturnType<typeof result.current.resolveSearchCandidate>>
      | undefined;

    await act(async () => {
      searchResult = await result.current.resolveSearchCandidate();
    });

    expect(searchResult).toEqual({
      message: CITY_NOT_FOUND_MESSAGE,
      status: "empty",
    });
    expect(result.current.showSuggestions).toBe(true);
    expect(result.current.suggestionsState).toEqual({
      items: [],
      status: "empty",
    });
  });

  it("returns an error when loading suggestions fails", async () => {
    jest.spyOn(global, "fetch").mockResolvedValue(
      new Response(null, {
        status: 500,
      }),
    );

    const { result } = renderHook(() => useCitySuggestions());

    act(() => {
      result.current.handleCityChange("San Salvador");
    });

    let searchResult:
      | Awaited<ReturnType<typeof result.current.resolveSearchCandidate>>
      | undefined;

    await act(async () => {
      searchResult = await result.current.resolveSearchCandidate();
    });

    expect(searchResult).toEqual({
      message: "Could not load city suggestions.",
      status: "error",
    });
    expect(result.current.showSuggestions).toBe(true);
    expect(result.current.suggestionsState).toEqual({
      items: [],
      message: "Could not load city suggestions.",
      status: "error",
    });
  });
});
