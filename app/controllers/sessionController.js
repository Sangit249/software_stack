const { Session } = require('../models/sessionModel');
const { User } = require('../models/userModel');

exports.getRequestForm = async (req, res) => {
    try {
        const teacher = await User.getUserById(req.params.teacherId);
        if (!teacher) return res.status(404).send("Teacher not found.");
        res.render("session-request-form", { title: "Request a Session", teacher });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading request form.");
    }
};

exports.postRequest = async (req, res) => {
    const learnerId = req.session.user.id;
    const { teacherId, meeting_place, scheduled_time, initial_message } = req.body;
    if (!teacherId || !meeting_place || !scheduled_time) {
        return res.status(400).send("Please fill in all required fields.");
    }
    if (String(learnerId) === String(teacherId)) {
        return res.status(400).send("You cannot send a session request to yourself.");
    }
    try {
        await Session.createSession(learnerId, teacherId, meeting_place, scheduled_time, initial_message);
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending session request.");
    }
};

exports.getMySessions = async (req, res) => {
    const userId = req.session.user.id;
    try {
        const rawSessions = await Session.getSessionsForUser(userId);
        const sessions = Session.addPermissions(rawSessions, userId);
        res.render("sessions-my", { title: "My Sessions", sessions, user: req.session.user, reviewed: req.query.reviewed || false });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading your sessions.");
    }
};

exports.postAccept = async (req, res) => {
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.TeacherID) !== String(userId)) return res.status(403).send("Only the teacher can accept this request.");
        if (session.Status !== "Pending") return res.status(400).send("This session is no longer pending.");
        await Session.updateStatus(sessionId, "Accepted");
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error accepting session.");
    }
};

exports.postDecline = async (req, res) => {
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.TeacherID) !== String(userId)) return res.status(403).send("Only the teacher can decline this request.");
        if (session.Status !== "Pending") return res.status(400).send("This session is no longer pending.");
        await Session.updateStatus(sessionId, "Declined");
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error declining session.");
    }
};

exports.postCancel = async (req, res) => {
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(userId)) return res.status(403).send("Only the learner can cancel this request.");
        if (session.Status !== "Pending") return res.status(400).send("Only pending sessions can be cancelled.");
        await Session.updateStatus(sessionId, "Cancelled");
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error cancelling session.");
    }
};