import { act, render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { WeatherPanel } from "@/components/WeatherPanel";
import { CITY_NOT_FOUND_MESSAGE } from "@/hooks/useCitySuggestions";

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

describe("WeatherPanel", () => {
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

  it("enables and disables the search button based on the input", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    render(<WeatherPanel />);

    const input = screen.getByLabelText("Ciudad");
    const searchButton = screen.getByRole("button", {
      name: "Buscar",
    });

    expect(searchButton).toBeDisabled();

    await user.type(input, "Sa");
    expect(searchButton).toBeEnabled();

    await user.clear(input);
    expect(searchButton).toBeDisabled();
  });

  it("shows the weather information after a successful search", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });
    const weatherResponse = createDeferred<Response>();

    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.startsWith("/api/cities?")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              suggestions: [
                {
                  country: "SV",
                  lat: 13.6929,
                  lon: -89.2182,
                  name: "San Salvador",
                  state: "San Salvador",
                },
              ],
            }),
            {
              status: 200,
            },
          ),
        );
      }

      if (url.startsWith("/api/weather?")) {
        return weatherResponse.promise;
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<WeatherPanel />);

    await user.type(screen.getByLabelText("Ciudad"), "San Salvador");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await screen.findByRole("button", {
      name: "San Salvador, San Salvador, SV",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "Buscando el clima",
        }),
      ).toBeInTheDocument();
    });

    weatherResponse.resolve(
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
      expect(
        screen.getByRole("heading", {
          name: "Resultado",
        }),
      ).toBeInTheDocument();
    });

    expect(screen.getByText("27 C")).toBeInTheDocument();
    expect(screen.getByText("74%")).toBeInTheDocument();
    expect(screen.getByText("nubes dispersas")).toBeInTheDocument();
    expect(
      screen.getByText("Consulta actual: San Salvador."),
    ).toBeInTheDocument();
  });

  it("shows a not found error when the city is invalid", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.startsWith("/api/cities?")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              suggestions: [],
            }),
            {
              status: 200,
            },
          ),
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<WeatherPanel />);

    await user.type(screen.getByLabelText("Ciudad"), "Xx");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await screen.findByText(CITY_NOT_FOUND_MESSAGE);

    await user.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "No se encontro la ciudad",
        }),
      ).toBeInTheDocument();
    });

    expect(screen.getAllByText(CITY_NOT_FOUND_MESSAGE)).toHaveLength(2);
    expect(
      screen.getByText(
        "Prueba con otro nombre o elige una coincidencia del listado.",
      ),
    ).toBeInTheDocument();
  });

  it("shows a generic error when the weather request fails", async () => {
    const user = userEvent.setup({
      advanceTimers: jest.advanceTimersByTime,
    });

    jest.spyOn(global, "fetch").mockImplementation((input) => {
      const url = String(input);

      if (url.startsWith("/api/cities?")) {
        return Promise.resolve(
          new Response(
            JSON.stringify({
              suggestions: [
                {
                  country: "SV",
                  lat: 13.6929,
                  lon: -89.2182,
                  name: "San Salvador",
                  state: "San Salvador",
                },
              ],
            }),
            {
              status: 200,
            },
          ),
        );
      }

      if (url.startsWith("/api/weather?")) {
        return Promise.resolve(
          new Response(null, {
            status: 500,
          }),
        );
      }

      throw new Error(`Unexpected request: ${url}`);
    });

    render(<WeatherPanel />);

    await user.type(screen.getByLabelText("Ciudad"), "San Salvador");

    act(() => {
      jest.advanceTimersByTime(500);
    });

    await screen.findByRole("button", {
      name: "San Salvador, San Salvador, SV",
    });

    await user.click(
      screen.getByRole("button", {
        name: "Buscar",
      }),
    );

    await waitFor(() => {
      expect(
        screen.getByRole("heading", {
          name: "No pudimos completar la busqueda",
        }),
      ).toBeInTheDocument();
    });

    expect(
      screen.getByText("Could not load current weather."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Intenta nuevamente en unos segundos."),
    ).toBeInTheDocument();
  });
});
