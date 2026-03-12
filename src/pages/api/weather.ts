import type { NextApiRequest, NextApiResponse } from "next";

import {
  getCurrentWeatherByCoordinates,
  type CurrentWeather,
} from "@/services/weather";

type WeatherRouteResponse = {
  error?: string;
  weather?: CurrentWeather;
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherRouteResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed.",
    });
  }

  const lat = Number(req.query.lat);
  const lon = Number(req.query.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return res.status(400).json({
      error: "Latitude and longitude are required.",
    });
  }

  try {
    const weather = await getCurrentWeatherByCoordinates({ lat, lon });

    return res.status(200).json({ weather });
  } catch {
    return res.status(500).json({
      error: "Could not load current weather.",
    });
  }
}
