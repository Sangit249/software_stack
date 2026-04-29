const { Report } = require('../models/reportModel');
const { User } = require('../models/userModel');
const db = require('../services/db');

exports.getReports = async (req, res) => {
    try {
        const reports = await Report.getAllReports();
        res.render("reports", { title: "Reports", reports });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reports");
    }
};

exports.getReportForm = async (req, res) => {
    try {
        const reportedUser = await User.getUserById(req.params.userId);
        if (!reportedUser) return res.status(404).send("User not found.");
        if (String(req.session.user.id) === String(req.params.userId)) return res.status(400).send("You cannot report yourself.");
        res.render("report-form", { title: "Submit a Report", reportedUser, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading report form.");
    }
};

exports.postReport = async (req, res) => {
    const reporterId = req.session.user.id;
    const { reportedUserId, reason } = req.body;
    if (!reportedUserId || !reason || !reason.trim()) return res.status(400).send("Please provide a reason for the report.");
    if (String(reporterId) === String(reportedUserId)) return res.status(400).send("You cannot report yourself.");
    try {
        await db.query(
            `INSERT INTO Reports (ReporterID, ReportedUserID, Reason, Status) VALUES (?, ?, ?, 'Pending')`,
            [reporterId, reportedUserId, reason.trim()]
        );
        return res.redirect("/users/" + reportedUserId + "?reported=true");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error submitting report.");
    }
};