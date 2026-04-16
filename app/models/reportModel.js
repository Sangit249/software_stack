const db = require('../services/db');

class Report {
    // Get all reports
    static async getAllReports() {
        const sql = `
            SELECT
                r.ReportID,
                r.ReporterID,
                reporter.Full_Name AS ReporterName,
                r.ReportedUserID,
                reported.Full_Name AS ReportedUserName,
                r.Reason,
                r.Status
            FROM Reports r
            JOIN Users reporter ON r.ReporterID = reporter.UserID
            JOIN Users reported ON r.ReportedUserID = reported.UserID
        `;
        return await db.query(sql);
    }
}

module.exports = {
    Report
};