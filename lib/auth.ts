import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";
import pool from "./database";

// import { NextRequest } from "next/server";
export interface UserInfo {
  userId: string;
  userName: string;
  userRole: string;
  userEmail: string;
  nim?: string;
  fakultas?: string;
  prodi?: string;
  tempat_lahir?: string;
  tanggal_lahir?: string;
  jenis_kelamin?: string;
  phone?: string;
  alamat?: string;
  agama?: string;
  angkatan?: string;
  tahun_masuk?: string;
}

export async function getUserFromRequest(
  request: Request
): Promise<UserInfo | null> {
  try {
    // Get authorization header
    let token = null;
    const authHeader = request.headers.get("authorization");
    if (authHeader && authHeader.startsWith("Bearer ")) {
      token = authHeader.substring(7);
    } else {
      // Coba ambil token dari cookie jika tidak ada di header
      const cookieHeader = request.headers.get("cookie");
      if (cookieHeader) {
        const cookies = Object.fromEntries(
          cookieHeader.split(";").map((c) => {
            const [k, ...v] = c.trim().split("=");
            return [k, decodeURIComponent(v.join("="))];
          })
        );
        if (cookies.token) {
          token = cookies.token;
        }
      }
    }
    if (!token) {
      return null;
    }

    // Verify JWT token
    const decoded = jwt.verify(
      token,
      "your-super-secret-jwt-key-for-development"
    ) as any;

    if (!decoded) {
      return null;
    }

    // Get user info from database
    const userInfo = await getUserFromDatabase(decoded.userId);
    if (userInfo) {
      return userInfo;
    }

    // Fallback to token info if database lookup fails
    let displayName =
      decoded.name || decoded.email?.split("@")[0] || "Unknown User";

    // Special mapping for known users
    if (decoded.email === "itsnalendraa@gmail.com") {
      displayName = "Nalendra";
    } else if (decoded.email === "admin@tpa.com") {
      displayName = "Admin TPA";
    }

    return {
      userId: decoded.userId,
      userName: displayName,
      userRole: decoded.role || "USER",
      userEmail: decoded.email || "unknown@example.com",
    };
  } catch (error) {
    console.error("Error getting user from request:", error);
    return null;
  }
}

// New function to get user info from database
export async function getUserFromDatabase(
  userId: string
): Promise<UserInfo | null> {
  try {
    const client = await pool.connect();

    const query = `
      SELECT u.id, u.name, u.email, r.name as role_name,
        u.nim, u.fakultas, u.prodi, u.tempat_lahir, u.tanggal_lahir, u.jenis_kelamin, u.phone, u.alamat, u.agama, u.angkatan, u.tahun_masuk
      FROM users u
      LEFT JOIN roles r ON u.role_id = r.id
      WHERE u.id = $1
    `;

    const result = await client.query(query, [userId]);
    client.release();

    if (result.rows.length === 0) {
      return null;
    }

    const user = result.rows[0];

    return {
      userId: user.id,
      userName: user.name,
      userRole: user.role_name || "USER",
      userEmail: user.email,
      nim: user.nim,
      fakultas: user.fakultas,
      prodi: user.prodi,
      tempat_lahir: user.tempat_lahir,
      tanggal_lahir: user.tanggal_lahir,
      jenis_kelamin: user.jenis_kelamin,
      phone: user.phone,
      alamat: user.alamat,
      agama: user.agama,
      angkatan: user.angkatan,
      tahun_masuk: user.tahun_masuk,
    };
  } catch (error) {
    console.error("Error getting user from database:", error);
    return null;
  }
}

// Fallback user info for development/testing
export function getFallbackUserInfo(): UserInfo {
  return {
    userId: "admin-1",
    userName: "Admin TPA",
    userRole: "ADMIN",
    userEmail: "admin@tpa.com",
  };
}
