import { NextRequest, NextResponse } from "next/server";
import { getUserFromRequest } from "@/lib/auth";
import pool from "@/lib/database";
import jwt from "jsonwebtoken";

// Server-Sent Events connections
let sseConnections: Array<{
  id: string;
  response: Response;
  controller: ReadableStreamDefaultController;
}> = [];

export async function GET(request: NextRequest) {
  try {
    // Check if this is an SSE request
    const accept = request.headers.get("accept");
    
    let user = null;
    if (accept === "text/event-stream") {
      // For SSE, try to get token from query parameter
      const token = request.nextUrl.searchParams.get("token");
      if (token) {
        try {
          const decoded = jwt.verify(token, process.env.JWT_SECRET || "your-super-secret-jwt-key-for-development") as any;
          if (decoded) {
            // Create a mock request with the token in header for getUserFromRequest
            const mockRequest = new Request(request.url, {
              headers: {
                ...Object.fromEntries(request.headers.entries()),
                'authorization': `Bearer ${token}`
              }
            });
            user = await getUserFromRequest(mockRequest);
          }
        } catch (error) {
          console.error("SSE token verification failed:", error);
        }
      }
    } else {
      // For regular API requests, use normal authentication
      user = await getUserFromRequest(request);
    }

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (accept === "text/event-stream") {
      // Server-Sent Events endpoint
      const stream = new ReadableStream({
        start(controller) {
          const connectionId = Math.random().toString(36).substr(2, 9);
          
          // Add connection to active connections
          sseConnections.push({
            id: connectionId,
            response: new Response(),
            controller
          });

          // Send initial connection message
          controller.enqueue(`data: ${JSON.stringify({ type: 'connected', message: 'Connected to notifications' })}\n\n`);

          // Send all existing notifications from activity_logs
          pool.query(
            `SELECT 
              al.id,
              CASE 
                WHEN al.action = 'LOGIN' THEN 'user_login'
                WHEN al.action = 'LOGOUT' THEN 'user_logout'
                WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN 'test_created'
                WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN 'test_updated'
                WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN 'test_deleted'
                WHEN al.action = 'START_TEST' THEN 'test_started'
                WHEN al.action = 'COMPLETE_TEST' THEN 'test_completed'
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
                WHEN al.action = 'START_TEST' THEN CONCAT(al.user_name, ' telah memulai tes "', al.entity_name, '"')
                WHEN al.action = 'COMPLETE_TEST' THEN CONCAT(al.user_name, ' telah menyelesaikan tes "', al.entity_name, '"')
                WHEN al.action = 'REGISTER' THEN CONCAT('Pengguna baru "', al.user_name, '" telah mendaftar')
                WHEN al.action = 'UPDATE_PROFILE' THEN CONCAT(al.user_name, ' telah memperbarui profil')
                ELSE CONCAT(al.user_name, ' melakukan ', al.action, ' pada ', al.entity_type)
              END as message,
              al.user_id,
              COALESCE(al.user_name, 'System') as username,
              false as is_read,
              al.created_at,
              null as read_at
            FROM activity_logs al 
            ORDER BY al.created_at DESC 
            LIMIT 50`,
            (err, result) => {
              if (!err && result.rows.length > 0) {
                controller.enqueue(`data: ${JSON.stringify({ 
                  type: 'initial_notifications', 
                  notifications: result.rows
                })}\n\n`);
              }
            }
          );

          // Clean up on close
          request.signal.addEventListener('abort', () => {
            sseConnections = sseConnections.filter(conn => conn.id !== connectionId);
            controller.close();
          });
        }
      });

      return new Response(stream, {
        headers: {
          'Content-Type': 'text/event-stream',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Headers': 'Cache-Control'
        }
      });
    }

    // Regular API request - return notifications from activity_logs
    const page = parseInt(request.nextUrl.searchParams.get("page") || "1");
    const limit = parseInt(request.nextUrl.searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const notificationsQuery = await pool.query(
      `SELECT 
        al.id,
        CASE 
          WHEN al.action = 'LOGIN' THEN 'user_login'
          WHEN al.action = 'LOGOUT' THEN 'user_logout'
          WHEN al.action = 'CREATE' AND al.entity_type = 'TEST' THEN 'test_created'
          WHEN al.action = 'UPDATE' AND al.entity_type = 'TEST' THEN 'test_updated'
          WHEN al.action = 'DELETE' AND al.entity_type = 'TEST' THEN 'test_deleted'
          WHEN al.action = 'START_TEST' THEN 'test_started'
          WHEN al.action = 'COMPLETE_TEST' THEN 'test_completed'
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
          WHEN al.action = 'START_TEST' THEN CONCAT(al.user_name, ' telah memulai tes "', al.entity_name, '"')
          WHEN al.action = 'COMPLETE_TEST' THEN CONCAT(al.user_name, ' telah menyelesaikan tes "', al.entity_name, '"')
          WHEN al.action = 'REGISTER' THEN CONCAT('Pengguna baru "', al.user_name, '" telah mendaftar')
          WHEN al.action = 'UPDATE_PROFILE' THEN CONCAT(al.user_name, ' telah memperbarui profil')
          ELSE CONCAT(al.user_name, ' melakukan ', al.action, ' pada ', al.entity_type)
        END as message,
        al.user_id,
        COALESCE(al.user_name, 'System') as username,
        false as is_read,
        al.created_at,
        null as read_at
      FROM activity_logs al 
      ORDER BY al.created_at DESC 
      LIMIT $1 OFFSET $2`,
      [limit, offset]
    );

    const countQuery = await pool.query('SELECT COUNT(*) FROM activity_logs');
    const unreadCountQuery = await pool.query('SELECT COUNT(*) FROM activity_logs');

    return NextResponse.json({
      notifications: notificationsQuery.rows,
      total: parseInt(countQuery.rows[0].count),
      unreadCount: parseInt(unreadCountQuery.rows[0].count)
    });

  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH /api/admin/notifications - Mark notifications as read

export async function PATCH(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { notificationIds, markAsRead } = body;

    if (markAsRead) {
      await pool.query(
        'UPDATE notifications SET is_read = true, read_at = NOW() WHERE id = ANY($1)',
        [notificationIds]
      );
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Error updating notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getUserFromRequest(request);
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const days = parseInt(url.searchParams.get('days') || '30');
    
    // Delete notifications older than specified days
    const result = await pool.query(
      'DELETE FROM notifications WHERE created_at < NOW() - INTERVAL $1 DAY',
      [days]
    );

    return NextResponse.json({ 
      success: true, 
      deletedCount: result.rowCount 
    });

  } catch (error) {
    console.error("Error cleaning up notifications:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}