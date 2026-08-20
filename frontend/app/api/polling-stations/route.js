import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const constituency = searchParams.get("constituency");

    const filePath = path.join(
      process.cwd(),
      "database",
      "data",
      "polling_stations.json"
    );

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const filtered = constituency
      ? data.filter(
          (station) =>
            station.constituency === constituency ||
            String(station.constituency_id) === constituency
        )
      : data;

    return Response.json({
      success: true,
      count: filtered.length,
      data: filtered,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Unable to load polling stations.",
      },
      { status: 500 }
    );
  }
}
