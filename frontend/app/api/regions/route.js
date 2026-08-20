import fs from "fs";
import path from "path";

export async function GET() {
  try {
    const filePath = path.join(process.cwd(), "database", "data", "regions.json");

    const data = JSON.parse(fs.readFileSync(filePath, "utf8"));

    return Response.json({
      success: true,
      count: data.length,
      data,
    });
  } catch (error) {
    return Response.json(
      {
        success: false,
        message: "Unable to load regions.",
      },
      { status: 500 }
    );
  }
}
