import fs from "fs";
import path from "path";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const regionId = searchParams.get("region");

    const filePath = path.join(
      process.cwd(),
      "database",
      "data",
      "constituencies.json"
    );

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    const filtered = regionId
      ? data.filter((c) => String(c.region_id) === String(regionId))
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
        message: "Unable to load constituencies.",
      },
      { status: 500 }
    );
  }
}
