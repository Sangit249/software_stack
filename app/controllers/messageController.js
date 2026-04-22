const { Message } = require('../models/messageModel');
const { Session } = require('../models/sessionModel');

exports.getConversations = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const conversations = await Message.getConversationsForUser(userId);
        res.render("messages", { title: "My Messages", conversations, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading messages.");
    }
};

exports.getConversation = async (req, res) => {
    const userId = req.session.user.id;
    const sessionId = req.params.sessionId;
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(userId) && String(session.TeacherID) !== String(userId)) {
            return res.status(403).send("You are not part of this session.");
        }
        if (session.Status !== "Accepted") {
            return res.status(400).send("You can only message in accepted sessions.");
        }
        const messages = await Message.getMessagesForSession(sessionId);
        await Message.markAsRead(sessionId, userId);
        res.render("conversation", { title: "Conversation", session, messages, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading conversation.");
    }
};

exports.postMessage = async (req, res) => {
    const userId = req.session.user.id;
    const sessionId = req.params.sessionId;
    const { content } = req.body;
    if (!content || !content.trim()) return res.redirect("/messages/" + sessionId);
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(userId) && String(session.TeacherID) !== String(userId)) {
            return res.status(403).send("You are not part of this session.");
        }
        if (session.Status !== "Accepted") {
            return res.status(400).send("You can only message in accepted sessions.");
        }
        const receiverId = String(session.LearnerID) === String(userId) ? session.TeacherID : session.LearnerID;
        await Message.send(userId, receiverId, sessionId, content.trim());
        return res.redirect("/messages/" + sessionId);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending message.");
    }
};