const db = require('../services/db');

class Admin {

    static async getStats() {
        const totalUsers = await db.query("SELECT COUNT(*) AS count FROM Users");
        const totalSessions = await db.query("SELECT COUNT(*) AS count FROM Learning_Sessions");
        const totalReports = await db.query("SELECT COUNT(*) AS count FROM Reports");
        const pendingReports = await db.query("SELECT COUNT(*) AS count FROM Reports WHERE Status = 'Pending'");

        return {
            totalUsers: totalUsers[0].count,
            totalSessions: totalSessions[0].count,
            totalReports: totalReports[0].count,
            pendingReports: pendingReports[0].count
        };
    }

    static async getAllUsers() {
        return await db.query(
            "SELECT UserID, Full_Name, Username, Email, Role, Suspended, Joined_Date, Last_Active FROM Users"
        );
    }

    static async updateUserRole(userId, newRole) {
        return await db.query(
            "UPDATE Users SET Role = ? WHERE UserID = ?",
            [newRole, userId]
        );
    }

    static async deleteUser(userId) {
        await db.query("DELETE FROM User_Languages WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Availability WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Interests WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Preferences WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM Users WHERE UserID = ?", [userId]);
    }

    static async getAllReports() {
        return await db.query(`
            SELECT r.*, 
                reporter.Full_Name AS ReporterName,
                reported.Full_Name AS ReportedName
            FROM Reports r
            JOIN Users reporter ON r.ReporterID = reporter.UserID
            JOIN Users reported ON r.ReportedUserID = reported.UserID
        `);
    }
}

module.exports = { Admin };