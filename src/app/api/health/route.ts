import { NextResponse } from "next/server";

export async function GET() {
  try {
    // 基本健康檢查
    const health = {
      status: "healthy",
      timestamp: new Date().toISOString(),
      service: "justpay-nextjs",
      uptime: process.uptime(),
      memory: process.memoryUsage(),
    };

    return NextResponse.json(health, { status: 200 });
  } catch (error) {
    const health = {
      status: "unhealthy",
      timestamp: new Date().toISOString(),
      service: "justpay-nextjs",
      error: error instanceof Error ? error.message : "Unknown error",
    };

    return NextResponse.json(health, { status: 500 });
  }
}
