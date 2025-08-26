import pool from "./database";

export interface ActivityLog {
  user_id?: string;
  user_name?: string;
  user_role?: string;
  action: string;
  entity_type: string;
  entity_id?: string;
  entity_name?: string;
  details?: any;
  ip_address?: string;
  user_agent?: string;
}

export async function logActivity(activity: ActivityLog) {
  try {
    const client = await pool.connect();

    const query = `
      INSERT INTO activity_logs (
        user_id, user_name, user_role, action, entity_type, 
        entity_id, entity_name, details, ip_address, user_agent
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
    `;

    const values = [
      activity.user_id || null,
      activity.user_name || null,
      activity.user_role || null,
      activity.action,
      activity.entity_type,
      activity.entity_id || null,
      activity.entity_name || null,
      activity.details ? JSON.stringify(activity.details) : null,
      activity.ip_address || null,
      activity.user_agent || null,
    ];

    await client.query(query, values);
    client.release();
  } catch (error) {
    console.error("Error logging activity:", error);
  }
}

// Helper function to get entity info from database
export async function getEntityInfo(
  entityType: string,
  entityId: string
): Promise<{ name: string; details?: any } | null> {
  try {
    const client = await pool.connect();
    let query = "";
    let params: any[] = [];

    switch (entityType) {
      case "QUESTION":
        query = `
          SELECT question as name, category, difficulty, tipeSoal, subkategori
          FROM questions 
          WHERE id = $1
        `;
        break;
      case "TEST":
        query = `
          SELECT name, description, duration, "totalQuestions"
          FROM tests 
          WHERE id = $1
        `;
        break;
      case "USER":
        query = `
          SELECT name, email, role
          FROM users 
          WHERE id = $1
        `;
        break;
      case "TEST_SESSION":
        query = `
          SELECT ts.id, t.name, ts.score, ts."maxScore", u.name as user_name
          FROM test_sessions ts
          JOIN tests t ON ts."testId" = t.id
          JOIN users u ON ts."userId" = u.id
          WHERE ts.id = $1
        `;
        break;
      default:
        client.release();
        return null;
    }

    params.push(entityId);
    const result = await client.query(query, params);
    client.release();

    if (result.rows.length === 0) {
      return null;
    }

    const row = result.rows[0];
    return {
      name: row.name || "Unknown",
      details: row,
    };
  } catch (error) {
    console.error("Error getting entity info:", error);
    return null;
  }
}

// Helper functions for common activities
export async function logUserLogin(
  userId: string,
  userName: string,
  userRole: string,
  ipAddress?: string,
  userAgent?: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "LOGIN",
    entity_type: "USER",
    entity_id: userId,
    entity_name: userName,
    ip_address: ipAddress,
    user_agent: userAgent,
  });
}

export async function logUserLogout(
  userId: string,
  userName: string,
  userRole: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "LOGOUT",
    entity_type: "USER",
    entity_id: userId,
    entity_name: userName,
  });
}

export async function logTestCreated(
  userId: string,
  userName: string,
  userRole: string,
  testId: string,
  testName: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "CREATE",
    entity_type: "TEST",
    entity_id: testId,
    entity_name: testName,
  });
}

export async function logTestUpdated(
  userId: string,
  userName: string,
  userRole: string,
  testId: string,
  testName: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "UPDATE",
    entity_type: "TEST",
    entity_id: testId,
    entity_name: testName,
  });
}

export async function logTestDeleted(
  userId: string,
  userName: string,
  userRole: string,
  testId: string,
  testName: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "DELETE",
    entity_type: "TEST",
    entity_id: testId,
    entity_name: testName,
  });
}

export async function logQuestionCreated(
  userId: string,
  userName: string,
  userRole: string,
  questionId: string,
  questionText: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "CREATE",
    entity_type: "QUESTION",
    entity_id: questionId,
    entity_name:
      questionText.substring(0, 50) + (questionText.length > 50 ? "..." : ""),
  });
}

export async function logQuestionUpdated(
  userId: string,
  userName: string,
  userRole: string,
  questionId: string,
  questionText: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "UPDATE",
    entity_type: "QUESTION",
    entity_id: questionId,
    entity_name:
      questionText.substring(0, 50) + (questionText.length > 50 ? "..." : ""),
  });
}

export async function logQuestionDeleted(
  userId: string,
  userName: string,
  userRole: string,
  questionId: string,
  questionText: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "DELETE",
    entity_type: "QUESTION",
    entity_id: questionId,
    entity_name:
      questionText.substring(0, 50) + (questionText.length > 50 ? "..." : ""),
  });
}

export async function logTestStarted(
  userId: string,
  userName: string,
  userRole: string,
  testId: string,
  testName: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "START",
    entity_type: "TEST_SESSION",
    entity_id: testId,
    entity_name: testName,
  });
}

export async function logTestCompleted(
  userId: string,
  userName: string,
  userRole: string,
  testId: string,
  testName: string,
  score: number
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "COMPLETE",
    entity_type: "TEST_SESSION",
    entity_id: testId,
    entity_name: testName,
    details: { score },
  });
}

export async function logUserRegistered(
  userId: string,
  userName: string,
  userRole: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "REGISTER",
    entity_type: "USER",
    entity_id: userId,
    entity_name: userName,
  });
}

export async function logUserProfileUpdated(
  userId: string,
  userName: string,
  userRole: string
) {
  await logActivity({
    user_id: userId,
    user_name: userName,
    user_role: userRole,
    action: "UPDATE_PROFILE",
    entity_type: "USER",
    entity_id: userId,
    entity_name: userName,
  });
}

// New function for automatic entity logging
export async function logEntityActivity(
  userId: string,
  userName: string,
  userRole: string,
  action: string,
  entityType: string,
  entityId: string,
  ipAddress?: string,
  userAgent?: string
) {
  try {
    // Get entity info from database
    const entityInfo = await getEntityInfo(entityType, entityId);

    await logActivity({
      user_id: userId,
      user_name: userName,
      user_role: userRole,
      action: action,
      entity_type: entityType,
      entity_id: entityId,
      entity_name: entityInfo?.name || "Unknown",
      details: entityInfo?.details,
      ip_address: ipAddress,
      user_agent: userAgent,
    });
  } catch (error) {
    console.error("Error logging entity activity:", error);
  }
}
