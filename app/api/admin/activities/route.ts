import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get("limit") || "10");
    const page = parseInt(searchParams.get("page") || "1");
    const search = searchParams.get("search") || "";
    const action = searchParams.get("action") || "";
    const entityType = searchParams.get("entityType") || "";
    const userRole = searchParams.get("userRole") || "";
    const offset = (page - 1) * limit;
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";

    const client = await pool.connect();

    try {
      // Build WHERE clause for filters
      const whereConditions = [];
      const queryParams = [];
      let paramIndex = 1;

      if (search) {
        whereConditions.push(`(
          al.user_name ILIKE $${paramIndex} OR 
          al.entity_name ILIKE $${paramIndex} OR 
          al.action ILIKE $${paramIndex} OR 
          al.entity_type ILIKE $${paramIndex}
        )`);
        queryParams.push(`%${search}%`);
        paramIndex++;
      }

      if (action) {
        whereConditions.push(`al.action = $${paramIndex}`);
        queryParams.push(action);
        paramIndex++;
      }

      if (entityType) {
        whereConditions.push(`al.entity_type = $${paramIndex}`);
        queryParams.push(entityType);
        paramIndex++;
      }

      if (userRole) {
        whereConditions.push(`al.user_role = $${paramIndex}`);
        queryParams.push(userRole);
        paramIndex++;
      }

      if (startDate) {
        whereConditions.push(`al.created_at::date >= $${paramIndex}`);
        queryParams.push(startDate);
        paramIndex++;
      }

      if (endDate) {
        whereConditions.push(`al.created_at::date <= $${paramIndex}`);
        queryParams.push(endDate);
        paramIndex++;
      }

      const whereClause =
        whereConditions.length > 0
          ? `WHERE ${whereConditions.join(" AND ")}`
          : "";

      // Get total count with filters
      const countQuery = `
        SELECT COUNT(*) as total 
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
      `;
      const countResult = await client.query(countQuery, queryParams);
      const total = parseInt(countResult.rows[0].total);

      // Get activities with filters
      const query = `
        SELECT 
          al.id,
          al.user_id,
          al.user_name,
          al.user_role,
          al.action,
          al.entity_type,
          al.entity_id,
          al.entity_name,
          al.details,
          al.ip_address,
          al.user_agent,
          al.created_at,
          u.name as full_user_name,
          u.email as user_email
        FROM activity_logs al
        LEFT JOIN users u ON al.user_id = u.id
        ${whereClause}
        ORDER BY al.created_at DESC
        LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
      `;

      const result = await client.query(query, [...queryParams, limit, offset]);

      // Format activities for frontend
      const normalizeRole = (role: string | null): string => {
        if (!role) return "User";
        const r = role.toUpperCase();
        if (r === "ADMIN" || r === "ADMINISTRATOR") return "Administrator";
        if (r === "PESERTA" || r === "USER") return "Peserta";
        if (r === "MODERATOR") return "Moderator";
        return role;
      };
      const activities = result.rows.map((row) => ({
        id: row.id,
        userId: row.user_id,
        userName: row.user_name || row.full_user_name || "Unknown User",
        userEmail: row.user_email,
        userRole: normalizeRole(row.user_role),
        action: row.action,
        entityType: row.entity_type,
        entityId: row.entity_id,
        entityName: row.entity_name,
        details: row.details,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        createdAt: row.created_at,
        // Format action for display
        actionDisplay: getActionDisplay(row.action, row.entity_type),
        // Format time ago
        timeAgo: getTimeAgo(row.created_at),
        // Get icon based on action and entity type
        icon: getActivityIcon(row.action, row.entity_type),
        // Get color based on action
        color: getActivityColor(row.action),
      }));

      return NextResponse.json({
        activities,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit),
        },
      });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error fetching activities:", error);
    return NextResponse.json(
      { error: "Terjadi kesalahan saat mengambil aktivitas" },
      { status: 500 }
    );
  }
}

function getActionDisplay(action: string, entityType: string): string {
  const actionMap: { [key: string]: string } = {
    LOGIN: "Login",
    LOGOUT: "Logout",
    REGISTER: "Register",
    CREATE: "Created",
    UPDATE: "Updated",
    DELETE: "Deleted",
    START: "Started",
    COMPLETE: "Completed",
    UPDATE_PROFILE: "Updated Profile",
  };

  const entityMap: { [key: string]: string } = {
    USER: "User",
    TEST: "Test",
    QUESTION: "Question",
    TEST_SESSION: "Test Session",
  };

  const actionText = actionMap[action] || action;
  const entityText = entityMap[entityType] || entityType;

  return `${actionText} ${entityText}`;
}

function getTimeAgo(date: Date): string {
  const now = new Date();
  const diffInSeconds = Math.floor(
    (now.getTime() - new Date(date).getTime()) / 1000
  );

  if (diffInSeconds < 60) {
    return `${diffInSeconds} seconds ago`;
  } else if (diffInSeconds < 3600) {
    const minutes = Math.floor(diffInSeconds / 60);
    return `${minutes} minute${minutes > 1 ? "s" : ""} ago`;
  } else if (diffInSeconds < 86400) {
    const hours = Math.floor(diffInSeconds / 3600);
    return `${hours} hour${hours > 1 ? "s" : ""} ago`;
  } else {
    const days = Math.floor(diffInSeconds / 86400);
    return `${days} day${days > 1 ? "s" : ""} ago`;
  }
}

function getActivityIcon(action: string, entityType: string): string {
  if (action === "LOGIN") return "🔐";
  if (action === "LOGOUT") return "🚪";
  if (action === "REGISTER") return "👤";
  if (action === "CREATE") return "➕";
  if (action === "UPDATE") return "✏️";
  if (action === "DELETE") return "🗑️";
  if (action === "START") return "▶️";
  if (action === "COMPLETE") return "✅";
  if (action === "UPDATE_PROFILE") return "👤";

  return "📝";
}

function getActivityColor(action: string): string {
  if (action === "LOGIN" || action === "REGISTER") return "text-green-600";
  if (action === "CREATE" || action === "COMPLETE") return "text-blue-600";
  if (action === "UPDATE" || action === "UPDATE_PROFILE")
    return "text-yellow-600";
  if (action === "DELETE") return "text-red-600";
  if (action === "LOGOUT") return "text-gray-600";
  if (action === "START") return "text-purple-600";

  return "text-gray-600";
}
