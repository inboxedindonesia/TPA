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

    const res = NextResponse.json({
      success: true,
      message: "Logout berhasil",
    });
    // Clear auth cookie
    res.cookies.set("token", "", {
      httpOnly: true,
      path: "/",
      maxAge: 0,
      sameSite: "lax",
    });
    return res;
  } catch (error) {
    console.error("Error in logout:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat logout" },
      { status: 500 }
    );
  }
}
