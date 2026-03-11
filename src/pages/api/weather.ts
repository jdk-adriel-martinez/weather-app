import type { NextApiRequest, NextApiResponse } from "next";

type WeatherRouteResponse = {
  configured: boolean;
  message: string;
};

const getWeatherApiKey = () =>
  process.env.OPENWEATHER_API_KEY ?? process.env.WEATHER_API_KEY;

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
