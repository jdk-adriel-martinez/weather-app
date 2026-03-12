import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

import { CitySuggestions } from "@/components/CitySuggestions";
import { CITY_NOT_FOUND_MESSAGE } from "@/hooks/useCitySuggestions";

describe("CitySuggestions", () => {
  it("renders loading, error and empty states", () => {
    const onSelect = jest.fn();

    const { rerender } = render(
      <CitySuggestions
        onSelect={onSelect}
        suggestionsState={{
          items: [],
          status: "loading",
        }}
      />,
    );

    expect(screen.getByText("Buscando coincidencias...")).toBeInTheDocument();

    rerender(
      <CitySuggestions
        onSelect={onSelect}
        suggestionsState={{
          items: [],
          message: "No fue posible cargar sugerencias.",
          status: "error",
        }}
      />,
    );

    expect(
      screen.getByText("No fue posible cargar sugerencias."),
    ).toBeInTheDocument();

    rerender(
      <CitySuggestions
        onSelect={onSelect}
        suggestionsState={{
          items: [],
          status: "empty",
        }}
      />,
    );

    expect(screen.getByText(CITY_NOT_FOUND_MESSAGE)).toBeInTheDocument();
  });

  it("renders suggestions and forwards the selected city", async () => {
    const user = userEvent.setup();
    const onSelect = jest.fn();

    render(
      <CitySuggestions
        onSelect={onSelect}
        suggestionsState={{
          items: [
            {
              country: "SV",
              lat: 13.6929,
              lon: -89.2182,
              name: "San Salvador",
              state: "San Salvador",
            },
          ],
          status: "success",
        }}
      />,
    );

    await user.click(
      screen.getByRole("button", {
        name: "San Salvador, San Salvador, SV",
      }),
    );

    expect(onSelect).toHaveBeenCalledWith({
      country: "SV",
      lat: 13.6929,
      lon: -89.2182,
      name: "San Salvador",
      state: "San Salvador",
    });
  });
});
