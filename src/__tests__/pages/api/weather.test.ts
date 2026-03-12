import type { NextApiRequest, NextApiResponse } from "next";

import handler from "@/pages/api/weather";
import { getCurrentWeatherByCoordinates } from "@/services/weather";

jest.mock("@/services/weather", () => ({
  getCurrentWeatherByCoordinates: jest.fn(),
}));

function createMockResponse<T>() {
  const response = {
    body: undefined as T | undefined,
    json: jest.fn((payload: T) => {
      response.body = payload;
      return response;
    }),
    setHeader: jest.fn(),
    status: jest.fn((statusCode: number) => {
      response.statusCode = statusCode;
      return response;
    }),
    statusCode: 200,
  };

  return response as unknown as NextApiResponse<T> & {
    body?: T;
    setHeader: jest.Mock;
    status: jest.Mock;
    statusCode: number;
  };
}

describe("/api/weather", () => {
  const mockedGetCurrentWeatherByCoordinates = jest.mocked(
    getCurrentWeatherByCoordinates,
  );

  beforeEach(() => {
    mockedGetCurrentWeatherByCoordinates.mockReset();
  });

  it("rejects methods other than GET", async () => {
    const req = {
      method: "POST",
      query: {},
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      weather?: unknown;
    }>();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET");
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({
      error: "Method not allowed.",
    });
  });

  it("returns a validation error when coordinates are invalid", async () => {
    const req = {
      method: "GET",
      query: {
        lat: "invalid",
        lon: "13.6929",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      weather?: unknown;
    }>();

    await handler(req, res);

    expect(mockedGetCurrentWeatherByCoordinates).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(400);
    expect(res.body).toEqual({
      error: "Latitude and longitude are required.",
    });
  });

  it("returns current weather for valid coordinates", async () => {
    mockedGetCurrentWeatherByCoordinates.mockResolvedValue({
      city: "San Salvador",
      description: "nubes dispersas",
      humidity: 74,
      temperature: 27.4,
    });

    const req = {
      method: "GET",
      query: {
        lat: "13.6929",
        lon: "-89.2182",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      weather?: unknown;
    }>();

    await handler(req, res);

    expect(mockedGetCurrentWeatherByCoordinates).toHaveBeenCalledWith({
      lat: 13.6929,
      lon: -89.2182,
    });
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      weather: {
        city: "San Salvador",
        description: "nubes dispersas",
        humidity: 74,
        temperature: 27.4,
      },
    });
  });

  it("returns a server error when the weather lookup fails", async () => {
    mockedGetCurrentWeatherByCoordinates.mockRejectedValue(new Error("Boom"));

    const req = {
      method: "GET",
      query: {
        lat: "13.6929",
        lon: "-89.2182",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      weather?: unknown;
    }>();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({
      error: "Could not load current weather.",
    });
  });
});
