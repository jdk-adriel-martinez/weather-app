import type { NextApiRequest, NextApiResponse } from "next";

import { searchCitiesByName, type CitySuggestion } from "@/services/weather";

type CitiesRouteResponse = {
  error?: string;
  suggestions: CitySuggestion[];
};

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<CitiesRouteResponse>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({
      error: "Method not allowed.",
      suggestions: [],
    });
  }

  const { q } = req.query;
  const query = typeof q === "string" ? q.trim() : "";

  if (query.length < 2) {
    return res.status(200).json({ suggestions: [] });
  }

  try {
    const suggestions = await searchCitiesByName(query);

    return res.status(200).json({ suggestions });
  } catch {
    return res.status(500).json({
      error: "Could not load city suggestions.",
      suggestions: [],
    });
  }
}
