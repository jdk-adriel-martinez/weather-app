jest.mock("@/components/WeatherPanel", () => ({
  WeatherPanel: () => <div data-testid="weather-panel" />,
}));

import { render, screen } from "@testing-library/react";

import Home from "@/pages/index";

describe("Home page", () => {
  it("renders the weather panel", () => {
    render(<Home />);

    expect(screen.getByTestId("weather-panel")).toBeInTheDocument();
  });
});
