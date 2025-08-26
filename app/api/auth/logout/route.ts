import { NextRequest, NextResponse } from "next/server";
import { logUserLogout } from "@/lib/activityLogger";
import { getUserFromRequest } from "@/lib/auth";

export async function POST(request: NextRequest) {
  try {
    // Get user info from request
    const userInfo = await getUserFromRequest(request);

    if (userInfo) {
      // Log logout activity
      await logUserLogout(
        userInfo.userId,
        userInfo.userName,
        userInfo.userRole
      );
    }

    return NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
  } catch (error) {
    console.error("Error in logout:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout" },
      { status: 500 }
    );
  }
}
