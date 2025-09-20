import { NextRequest, NextResponse } from "next/server";
import pool from "@/lib/database";
import { getUserFromRequest } from "@/lib/auth";

export async function GET(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user || (user.userRole !== "Administrator")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const search = searchParams.get("search") || "";
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";
    const userRole = searchParams.get("userRole") || "";
    const startDate = searchParams.get("startDate") || "";
    const endDate = searchParams.get("endDate") || "";
    const exportData = searchParams.get("export") === "true";

    const offset = (page - 1) * limit;

    // Build WHERE conditions
    const conditions = [];
    const params = [];
    let paramIndex = 1;

    if (search) {
      conditions.push(`(al.entity_name ILIKE $${paramIndex} OR al.user_name ILIKE $${paramIndex} OR al.action ILIKE $${paramIndex})`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (type) {
      // Map notification types to activity log actions
      const actionMap: { [key: string]: string[] } = {
        'user_login': ['LOGIN'],
        'user_logout': ['LOGOUT'],
        'test_created': ['CREATE'],
        'test_updated': ['UPDATE'],
        'test_deleted': ['DELETE'],
        'test_started': ['START'],
        'test_completed': ['COMPLETE'],
        'user_registered': ['REGISTER'],
        'user_profile_updated': ['UPDATE_PROFILE']
      };
      
      if (actionMap[type]) {
        conditions.push(`al.action = ANY($${paramIndex})`);
        params.push(actionMap[type]);
        paramIndex++;
      }
    }

    if (userRole) {
      conditions.push(`al.user_role = $${paramIndex}`);
      params.push(userRole);
      paramIndex++;
    }

    if (startDate) {
      conditions.push(`al.created_at >= $${paramIndex}`);
      params.push(`${startDate} 00:00:00`);
      paramIndex++;
    }

    if (endDate) {
      conditions.push(`al.created_at <= $${paramIndex}`);
      params.push(`${endDate} 23:59:59`);
      paramIndex++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    if (exportData) {
      // Export as CSV
      const exportQuery = `
        SELECT 
          al.id,
          CASE 
            WHEN al.action = 'LOGIN' THEN 'user_login'
            WHEN al.action = 'LOGOUT' THEN 'user_logout'
            WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN 'test_created'
            WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN 'test_updated'
            WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN 'test_deleted'
            WHEN al.action = 'START' AND al.entity_type = 'TEST_SESSION' THEN 'test_started'
            WHEN al.action = 'COMPLETE' AND al.entity_type = 'TEST_SESSION' THEN 'test_completed'
            WHEN al.action = 'REGISTER' THEN 'user_registered'
            WHEN al.action = 'UPDATE_PROFILE' THEN 'user_profile_updated'
            ELSE 'general'
          END as type,
          CASE 
            WHEN al.action = 'LOGIN' THEN CONCAT(al.user_name, ' telah login ke sistem')
            WHEN al.action = 'LOGOUT' THEN CONCAT(al.user_name, ' telah logout dari sistem')
            WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah dibuat oleh ', al.user_name)
            WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah diperbarui oleh ', al.user_name)
            WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah dihapus oleh ', al.user_name)
            WHEN al.action = 'START' AND al.entity_type = 'TEST_SESSION' THEN CONCAT(al.user_name, ' telah memulai tes "', al.entity_name, '"')
            WHEN al.action = 'COMPLETE' AND al.entity_type = 'TEST_SESSION' THEN CONCAT(al.user_name, ' telah menyelesaikan tes "', al.entity_name, '"')
            WHEN al.action = 'REGISTER' THEN CONCAT('Pengguna baru "', al.user_name, '" telah mendaftar')
            WHEN al.action = 'UPDATE_PROFILE' THEN CONCAT(al.user_name, ' telah memperbarui profil')
            ELSE CONCAT(al.user_name, ' melakukan ', al.action, ' pada ', al.entity_type)
          END as message,
          COALESCE(al.user_name, 'System') as username,
          COALESCE(al.user_role, 'System') as user_role,
          al.created_at
        FROM activity_logs al
        ${whereClause}
        ORDER BY al.created_at DESC
      `;

      const result = await pool.query(exportQuery, params);
      
      // Convert to CSV
      const headers = ['ID', 'Type', 'Message', 'Username', 'Role', 'Created At'];
      const csvRows = [headers.join(',')];
      
      result.rows.forEach((row: any) => {
        const csvRow = [
          row.id,
          row.type,
          `"${row.message.replace(/"/g, '""')}"`,
          row.username,
          row.user_role,
          new Date(row.created_at).toLocaleString('id-ID')
        ];
        csvRows.push(csvRow.join(','));
      });

      const csvContent = csvRows.join('\n');
      
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="activity-logs-${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Get total count for pagination
    const countQuery = `
      SELECT COUNT(*) as total
      FROM activity_logs al
      ${whereClause}
    `;
    
    const countResult = await pool.query(countQuery, params);
    const total = parseInt(countResult.rows[0].total);
    const totalPages = Math.ceil(total / limit);

    // Get activity logs with pagination
    const notificationsQuery = `
      SELECT 
        al.id,
        CASE 
          WHEN al.action = 'LOGIN' THEN 'user_login'
          WHEN al.action = 'LOGOUT' THEN 'user_logout'
          WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN 'test_created'
          WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN 'test_updated'
          WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN 'test_deleted'
          WHEN al.action = 'START' AND al.entity_type = 'TEST_SESSION' THEN 'test_started'
          WHEN al.action = 'COMPLETE' AND al.entity_type = 'TEST_SESSION' THEN 'test_completed'
          WHEN al.action = 'REGISTER' THEN 'user_registered'
          WHEN al.action = 'UPDATE_PROFILE' THEN 'user_profile_updated'
          ELSE 'general'
        END as type,
        CASE 
          WHEN al.action = 'LOGIN' THEN CONCAT(al.user_name, ' telah login ke sistem')
          WHEN al.action = 'LOGOUT' THEN CONCAT(al.user_name, ' telah logout dari sistem')
          WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah dibuat oleh ', al.user_name)
          WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah diperbarui oleh ', al.user_name)
          WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN CONCAT('Tes "', al.entity_name, '" telah dihapus oleh ', al.user_name)
          WHEN al.action = 'START' AND al.entity_type = 'TEST_SESSION' THEN CONCAT(al.user_name, ' telah memulai tes "', al.entity_name, '"')
          WHEN al.action = 'COMPLETE' AND al.entity_type = 'TEST_SESSION' THEN CONCAT(al.user_name, ' telah menyelesaikan tes "', al.entity_name, '"')
          WHEN al.action = 'REGISTER' THEN CONCAT('Pengguna baru "', al.user_name, '" telah mendaftar')
          WHEN al.action = 'UPDATE_PROFILE' THEN CONCAT(al.user_name, ' telah memperbarui profil')
          ELSE CONCAT(al.user_name, ' melakukan ', al.action, ' pada ', al.entity_type)
        END as message,
        al.user_id,
        COALESCE(al.user_name, 'System') as username,
        COALESCE(al.user_role, 'System') as user_role,
        false as is_read,
        al.created_at,
        null as read_at
      FROM activity_logs al
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT $${paramIndex} OFFSET $${paramIndex + 1}
    `;

    params.push(limit, offset);
    const result = await pool.query(notificationsQuery, params);

    return NextResponse.json({
      notifications: result.rows,
      pagination: {
        page,
        limit,
        total,
        totalPages
      }
    });

  } catch (error) {
    console.error("Error fetching notification logs:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}