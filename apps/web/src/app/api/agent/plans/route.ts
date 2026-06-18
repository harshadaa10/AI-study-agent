import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    success: true,
    route: "/api/agent/plans",
    message: "Use POST /api/plans/generate or POST /api/agent with taskType GENERATE_PLAN"
  });
}
