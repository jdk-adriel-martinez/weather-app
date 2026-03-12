import { formatCitySuggestionLabel } from "@/utils/formatCitySuggestionLabel";

describe("formatCitySuggestionLabel", () => {
  it("returns only the city name when there is no state or country", () => {
    expect(
      formatCitySuggestionLabel({
        country: "",
        lat: 13.69,
        lon: -89.21,
        name: "San Salvador",
      }),
    ).toBe("San Salvador");
  });

  it("formats the city with state and country", () => {
    expect(
      formatCitySuggestionLabel({
        country: "SV",
        lat: 13.69,
        lon: -89.21,
        name: "San Salvador",
        state: "San Salvador",
      }),
    ).toBe("San Salvador, San Salvador, SV");
  });
});
