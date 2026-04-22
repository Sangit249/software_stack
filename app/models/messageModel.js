const db = require('../services/db');

class Message {

    static async getConversationsForUser(userId) {
        return await db.query(
            `SELECT DISTINCT
                ls.SessionID, ls.LearnerID, ls.TeacherID,
                learner.Full_Name AS LearnerName,
                teacher.Full_Name AS TeacherName,
                (SELECT COUNT(*) FROM Messages m 
                 WHERE m.SessionID = ls.SessionID 
                 AND m.ReceiverID = ? 
                 AND m.Is_Read = FALSE) AS UnreadCount
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             WHERE (ls.LearnerID = ? OR ls.TeacherID = ?)
             AND ls.Status = 'Accepted'`,
            [userId, userId, userId]
        );
    }

    static async getMessagesForSession(sessionId) {
        return await db.query(
            `SELECT m.MessageID, m.SenderID, m.Content, m.Sent_At, m.Is_Read,
                sender.Full_Name AS SenderName
             FROM Messages m
             JOIN Users sender ON m.SenderID = sender.UserID
             WHERE m.SessionID = ?
             ORDER BY m.Sent_At ASC`,
            [sessionId]
        );
    }

    static async markAsRead(sessionId, receiverId) {
        return await db.query(
            "UPDATE Messages SET Is_Read = TRUE WHERE SessionID = ? AND ReceiverID = ?",
            [sessionId, receiverId]
        );
    }

    static async send(senderId, receiverId, sessionId, content) {
        return await db.query(
            `INSERT INTO Messages (SenderID, ReceiverID, SessionID, Content) VALUES (?, ?, ?, ?)`,
            [senderId, receiverId, sessionId, content]
        );
    }
}

module.exports = { Message };