// Client-side activity logging utility

export interface ActivityLogData {
  action: string;
  entityType: string;
  entityId: string;
  entityName?: string;
  details?: any;
}

export class ClientActivityLogger {
  /**
   * Log activity from client-side
   */
  static async logActivity(data: ActivityLogData): Promise<boolean> {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        console.warn("No token found, skipping activity log");
        return false;
      }

      const response = await fetch("/api/activity-log", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        console.error("Failed to log activity:", response.statusText);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Error logging activity:", error);
      return false;
    }
  }

  /**
   * Log CRUD operations
   */
  static async logCRUD(
    entityType: string,
    entityId: string,
    operation: "CREATE" | "READ" | "UPDATE" | "DELETE",
    entityName?: string
  ): Promise<boolean> {
    return this.logActivity({
      action: operation,
      entityType,
      entityId,
      entityName,
    });
  }

  /**
   * Log question operations
   */
  static async logQuestionOperation(
    questionId: string,
    action: string,
    questionName?: string
  ): Promise<boolean> {
    return this.logActivity({
      action,
      entityType: "QUESTION",
      entityId: questionId,
      entityName: questionName,
    });
  }

  /**
   * Log test operations
   */
  static async logTestOperation(
    testId: string,
    action: string,
    testName?: string
  ): Promise<boolean> {
    return this.logActivity({
      action,
      entityType: "TEST",
      entityId: testId,
      entityName: testName,
    });
  }

  /**
   * Log user operations
   */
  static async logUserOperation(
    userId: string,
    action: string,
    userName?: string
  ): Promise<boolean> {
    return this.logActivity({
      action,
      entityType: "USER",
      entityId: userId,
      entityName: userName,
    });
  }

  /**
   * Log authentication
   */
  static async logAuth(
    userId: string,
    action: "LOGIN" | "LOGOUT" | "REGISTER"
  ): Promise<boolean> {
    return this.logActivity({
      action,
      entityType: "USER",
      entityId: userId,
    });
  }
}
