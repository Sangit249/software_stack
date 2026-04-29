const db = require('../services/db');

class Session {

    static async getSessionsForUser(userId) {
        return await db.query(
            `SELECT 
                ls.SessionID,
                ls.LearnerID,
                learner.Full_Name AS LearnerName,
                ls.TeacherID,
                teacher.Full_Name AS TeacherName,
                ls.Meeting_Place,
                ls.Scheduled_Time,
                ls.Initial_Message,
                ls.Status
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             WHERE ls.LearnerID = ? OR ls.TeacherID = ?
             ORDER BY ls.Scheduled_Time DESC`,
            [userId, userId]
        );
    }

    static async getPendingForUser(userId) {
        return await db.query(
            `SELECT 
                ls.SessionID,
                ls.LearnerID,
                learner.Full_Name AS LearnerName,
                ls.TeacherID,
                teacher.Full_Name AS TeacherName,
                ls.Meeting_Place,
                ls.Scheduled_Time,
                ls.Status
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             WHERE (ls.LearnerID = ? OR ls.TeacherID = ?)
             AND ls.Status = 'Pending'
             ORDER BY ls.Scheduled_Time ASC`,
            [userId, userId]
        );
    }

    static async getUpcomingForUser(userId) {
        return await db.query(
            `SELECT 
                ls.SessionID,
                ls.LearnerID,
                learner.Full_Name AS LearnerName,
                ls.TeacherID,
                teacher.Full_Name AS TeacherName,
                ls.Meeting_Place,
                ls.Scheduled_Time,
                ls.Status
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             WHERE (ls.LearnerID = ? OR ls.TeacherID = ?)
             AND ls.Status = 'Accepted'
             ORDER BY ls.Scheduled_Time DESC
             LIMIT 5`,
            [userId, userId]
        );
    }

    static async getSessionById(sessionId) {
        const rows = await db.query(
            `SELECT ls.*,
                learner.Full_Name AS LearnerName,
                teacher.Full_Name AS TeacherName
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             WHERE ls.SessionID = ?`,
            [sessionId]
        );
        return rows.length > 0 ? rows[0] : null;
    }

    static async createSession(learnerId, teacherId, meetingPlace, scheduledTime, initialMessage) {
        return await db.query(
            `INSERT INTO Learning_Sessions (LearnerID, TeacherID, Meeting_Place, Scheduled_Time, Initial_Message, Status)
             VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [learnerId, teacherId, meetingPlace, scheduledTime, initialMessage || null]
        );
    }

    static async updateStatus(sessionId, status) {
        return await db.query(
            "UPDATE Learning_Sessions SET Status = ? WHERE SessionID = ?",
            [status, sessionId]
        );
    }

    // helper — adds permission flags based on who is logged in
    static addPermissions(sessions, userId) {
        return sessions.map(s => ({
            ...s,
            canAccept:  String(userId) === String(s.TeacherID) && s.Status === 'Pending',
            canDecline: String(userId) === String(s.TeacherID) && s.Status === 'Pending',
            canCancel:  String(userId) === String(s.LearnerID) && s.Status === 'Pending',
            canReview:  String(userId) === String(s.LearnerID) && s.Status === 'Accepted',
            canMessage: s.Status === 'Accepted'
        }));
    }
}

module.exports = { Session };