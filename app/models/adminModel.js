const db = require('../services/db');

class Admin {

    // ==============================
    // Get platform stats for dashboard
    // Returns counts of users, sessions, reports, and pending reports
    // ==============================
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

    // ==============================
    // Get all users for admin management table
    // Does not return passwords for security
    // ==============================
    static async getAllUsers() {
        return await db.query(
            "SELECT UserID, Full_Name, Username, Email, Role, Joined_Date, Last_Active FROM Users"
        );
    }

    // ==============================
    // Change a user's role
    // Allowed roles: Learner, Teacher, Admin
    // ==============================
    static async updateUserRole(userId, newRole) {
        return await db.query(
            "UPDATE Users SET Role = ? WHERE UserID = ?",
            [newRole, userId]
        );
    }

    // ==============================
    // Delete a user and all their related data
    // Must delete child records first to avoid foreign key errors
    // ==============================
    static async deleteUser(userId) {
        await db.query("DELETE FROM User_Languages WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Availability WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Interests WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM User_Preferences WHERE UserID = ?", [userId]);
        await db.query("DELETE FROM Users WHERE UserID = ?", [userId]);
    }

    // ==============================
    // Get all reports with reporter and reported user names
    // Joins Users table twice to get both names
    // ==============================
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