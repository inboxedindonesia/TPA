import { NextRequest, NextResponse } from "next/server";
import { logEntityActivity } from "@/lib/activityLogger";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    const { action, entityType, entityId, entityName, details } =
      await request.json();

    // Get user info from request
    const userInfo = await getUserFromRequest(request);
    if (!userInfo) {
      return NextResponse.json(
        { error: "User tidak terautentikasi" },
        { status: 401 }
      );
    }

    // Get IP and User Agent
    const ipAddress =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";

    // Log activity
    await logEntityActivity(
      userInfo.userId,
      userInfo.userName,
      userInfo.userRole,
      action,
      entityType,
      entityId,
      ipAddress,
      userAgent
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error in activity log API:", error);
    return NextResponse.json(
      {
        error: "Terjadi kesalahan saat logging aktivitas",
        details: String(error),
      },
      { status: 500 }
    );
  }
}
