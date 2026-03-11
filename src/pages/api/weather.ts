import type { NextApiRequest, NextApiResponse } from "next";

import { getWeatherApiKey } from "@/services/weather";

type WeatherRouteResponse = {
  configured: boolean;
  message: string;
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse<WeatherRouteResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      configured: false,
      message: "Method not allowed.",
    });
  }

  const apiKey = getWeatherApiKey();

  return res.status(200).json({
    configured: Boolean(apiKey),
    message: apiKey
      ? "Weather API route is ready."
      : "Weather API key is not configured.",
  });
}
