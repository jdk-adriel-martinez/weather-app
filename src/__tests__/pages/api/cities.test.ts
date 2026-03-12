import type { NextApiRequest, NextApiResponse } from "next";

import handler from "@/pages/api/cities";
import { searchCitiesByName } from "@/services/weather";

jest.mock("@/services/weather", () => ({
  searchCitiesByName: jest.fn(),
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

describe("/api/cities", () => {
  const mockedSearchCitiesByName = jest.mocked(searchCitiesByName);

  beforeEach(() => {
    mockedSearchCitiesByName.mockReset();
  });

  it("rejects methods other than GET", async () => {
    const req = {
      method: "POST",
      query: {},
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      suggestions: unknown[];
    }>();

    await handler(req, res);

    expect(res.setHeader).toHaveBeenCalledWith("Allow", "GET");
    expect(res.status).toHaveBeenCalledWith(405);
    expect(res.body).toEqual({
      error: "Method not allowed.",
      suggestions: [],
    });
  });

  it("returns an empty list for short queries", async () => {
    const req = {
      method: "GET",
      query: {
        q: "S",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      suggestions: unknown[];
    }>();

    await handler(req, res);

    expect(mockedSearchCitiesByName).not.toHaveBeenCalled();
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      suggestions: [],
    });
  });

  it("returns mapped city suggestions", async () => {
    mockedSearchCitiesByName.mockResolvedValue([
      {
        country: "SV",
        lat: 13.6929,
        lon: -89.2182,
        name: "San Salvador",
        state: "San Salvador",
      },
    ]);

    const req = {
      method: "GET",
      query: {
        q: " San Salvador ",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      suggestions: unknown[];
    }>();

    await handler(req, res);

    expect(mockedSearchCitiesByName).toHaveBeenCalledWith("San Salvador");
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.body).toEqual({
      suggestions: [
        {
          country: "SV",
          lat: 13.6929,
          lon: -89.2182,
          name: "San Salvador",
          state: "San Salvador",
        },
      ],
    });
  });

  it("returns a server error when city suggestions fail", async () => {
    mockedSearchCitiesByName.mockRejectedValue(new Error("Boom"));

    const req = {
      method: "GET",
      query: {
        q: "San Salvador",
      },
    } as NextApiRequest;
    const res = createMockResponse<{
      error?: string;
      suggestions: unknown[];
    }>();

    await handler(req, res);

    expect(res.status).toHaveBeenCalledWith(500);
    expect(res.body).toEqual({
      error: "Could not load city suggestions.",
      suggestions: [],
    });
  });
});
