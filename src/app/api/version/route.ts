import { NextResponse } from "next/server";
import { readFileSync } from "fs";
import { join } from "path";

export async function GET() {
  try {
    // 读取build ID
    const buildIdPath = join(process.cwd(), ".next/BUILD_ID");
    let buildId = "";
    try {
      buildId = readFileSync(buildIdPath, "utf-8").trim();
    } catch {
      // 如果没有BUILD_ID文件，用时间戳
      buildId = Date.now().toString();
    }

    return NextResponse.json({
      buildId,
      timestamp: Date.now(),
    }, {
      headers: {
        "Cache-Control": "no-cache, no-store, must-revalidate",
      },
    });
  } catch {
    return NextResponse.json({ buildId: "", timestamp: Date.now() });
  }
}
