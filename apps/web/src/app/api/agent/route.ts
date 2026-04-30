import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    console.log("Received request:", body);

    return NextResponse.json({
      success: true,
      message: "Agent API working!",
      data: body
    });
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: "Something went wrong"
    });
  }
}