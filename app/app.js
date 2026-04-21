require('dotenv').config();

const express = require("express");
var app = express();

app.set('view engine', 'pug');
app.set('views', './app/views');

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true }
}));

app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).send("Access denied.");
    }
    next();
}

function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    if (!req.session.user.profileComplete && req.path !== "/complete-profile") {
        return res.redirect("/complete-profile");
    }
    next();
}

const db = require('./services/db');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

const { User } = require('./models/userModel');
const { Category } = require('./models/categoryModel');
const { Report } = require('./models/reportModel');
const { Review } = require('./models/reviewModel');
const { Admin } = require('./models/adminModel');
const { Session } = require('./models/sessionModel');

// ==============================
// HOME ROUTE
// ==============================
app.get("/", function(req, res) {
    res.render("home", { title: "Home" });
});

// ==============================
// DASHBOARD ROUTE
// ==============================
app.get("/dashboard", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const user = await User.getUserById(userId);
        const languages = await User.getUserLanguages(userId);

        const rawPending = await Session.getPendingForUser(userId);
        const pending = Session.addPermissions(rawPending, userId);

        const rawUpcoming = await Session.getUpcomingForUser(userId);
        const upcoming = Session.addPermissions(rawUpcoming, userId);

        const reviews = await db.query(
            `SELECT r.ReviewID, r.Star_Rating, r.Comment,
                learner.Full_Name AS ReviewerName
             FROM Reviews r
             JOIN Learning_Sessions ls ON r.SessionID = ls.SessionID
             JOIN Users learner ON ls.LearnerID = learner.UserID
             WHERE ls.TeacherID = ?
             ORDER BY r.ReviewID DESC LIMIT 5`,
            [userId]
        );

        const totalSessionsRow = await db.query(
            "SELECT COUNT(*) AS total FROM Learning_Sessions WHERE LearnerID = ? OR TeacherID = ?",
            [userId, userId]
        );
        const acceptedSessionsRow = await db.query(
            "SELECT COUNT(*) AS total FROM Learning_Sessions WHERE (LearnerID = ? OR TeacherID = ?) AND Status = 'Accepted'",
            [userId, userId]
        );
        const pendingCountRow = await db.query(
            "SELECT COUNT(*) AS total FROM Learning_Sessions WHERE (LearnerID = ? OR TeacherID = ?) AND Status = 'Pending'",
            [userId, userId]
        );
        const reviewCountRow = await db.query(
            `SELECT COUNT(*) AS total FROM Reviews r
             JOIN Learning_Sessions ls ON r.SessionID = ls.SessionID
             WHERE ls.TeacherID = ?`,
            [userId]
        );

        const stats = {
            totalSessions: totalSessionsRow[0].total,
            acceptedSessions: acceptedSessionsRow[0].total,
            pendingCount: pendingCountRow[0].total,
            reviewCount: reviewCountRow[0].total
        };

        res.render("dashboard", {
            title: "My Dashboard",
            user, languages, pending, upcoming, reviews, stats
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard.");
    }
});

// ==============================
// MESSAGING ROUTES
// ==============================
app.get("/messages", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const conversations = await db.query(
            `SELECT DISTINCT
                ls.SessionID,
                ls.LearnerID,
                ls.TeacherID,
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
        res.render("messages", { title: "My Messages", conversations, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading messages.");
    }
});

app.get("/messages/:sessionId", requireLogin, async function(req, res) {
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
        const messages = await db.query(
            `SELECT m.MessageID, m.SenderID, m.Content, m.Sent_At, m.Is_Read,
                sender.Full_Name AS SenderName
             FROM Messages m
             JOIN Users sender ON m.SenderID = sender.UserID
             WHERE m.SessionID = ?
             ORDER BY m.Sent_At ASC`,
            [sessionId]
        );
        await db.query(
            "UPDATE Messages SET Is_Read = TRUE WHERE SessionID = ? AND ReceiverID = ?",
            [sessionId, userId]
        );
        res.render("conversation", { title: "Conversation", session, messages, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading conversation.");
    }
});

app.post("/messages/:sessionId", requireLogin, async function(req, res) {
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
        await db.query(
            `INSERT INTO Messages (SenderID, ReceiverID, SessionID, Content) VALUES (?, ?, ?, ?)`,
            [userId, receiverId, sessionId, content.trim()]
        );
        return res.redirect("/messages/" + sessionId);
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending message.");
    }
});

// ==============================
// ADMIN ROUTES
// ==============================
app.get("/admin", requireAdmin, async function(req, res) {
    try {
        const stats = await Admin.getStats();
        res.render("admin/dashboard", { title: "Admin Dashboard", stats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading admin dashboard");
    }
});

app.get("/admin/users", requireAdmin, async function(req, res) {
    try {
        const users = await Admin.getAllUsers();
        res.render("admin/users", { title: "Manage Users", users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
});

app.post("/admin/users/:id/delete", requireAdmin, async function(req, res) {
    try {
        await Admin.deleteUser(req.params.id);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting user");
    }
});

app.post("/admin/users/:id/role", requireAdmin, async function(req, res) {
    try {
        const allowedRoles = ["Learner", "Teacher", "Admin"];
        if (!allowedRoles.includes(req.body.role)) {
            return res.status(400).send("Invalid role");
        }
        await Admin.updateUserRole(req.params.id, req.body.role);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating role");
    }
});

app.get("/admin/reports", requireAdmin, async function(req, res) {
    try {
        const reports = await Admin.getAllReports();
        res.render("admin/reports", { title: "Manage Reports", reports });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reports");
    }
});

app.post("/admin/reports/:id/resolve", requireAdmin, async function(req, res) {
    try {
        await db.query("UPDATE Reports SET Status = 'Resolved' WHERE ReportID = ?", [req.params.id]);
        return res.redirect("/admin/reports");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error resolving report.");
    }
});

app.post("/admin/reports/:id/dismiss", requireAdmin, async function(req, res) {
    try {
        await db.query("UPDATE Reports SET Status = 'Dismissed' WHERE ReportID = ?", [req.params.id]);
        return res.redirect("/admin/reports");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error dismissing report.");
    }
});

// ==============================
// ADMIN LANGUAGE MANAGEMENT
// ==============================
app.get("/admin/languages", requireAdmin, async function(req, res) {
    try {
        const languages = await db.query("SELECT * FROM Languages ORDER BY Language_Name");
        const categories = await db.query("SELECT * FROM Categories ORDER BY Category_Name");
        res.render("admin/languages", { title: "Manage Languages", languages, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading languages.");
    }
});

app.post("/admin/languages/add", requireAdmin, async function(req, res) {
    const name = (req.body.language_name || "").trim();
    const categoryId = req.body.category_id || null;
    if (!name) return res.redirect("/admin/languages");
    try {
        await db.query(
            "INSERT INTO Languages (Language_Name, CategoryID) VALUES (?, ?)",
            [name, categoryId]
        );
        return res.redirect("/admin/languages");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const languages = await db.query("SELECT * FROM Languages ORDER BY Language_Name");
            const categories = await db.query("SELECT * FROM Categories ORDER BY Category_Name");
            return res.render("admin/languages", {
                title: "Manage Languages",
                languages,
                categories,
                error: `Language "${name}" already exists.`
            });
        }
        console.error(err);
        res.status(500).send("Error adding language.");
    }
});

app.post("/admin/languages/:id/delete", requireAdmin, async function(req, res) {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM Language_Categories WHERE LanguageID = ?", [id]);
        await db.query("DELETE FROM User_Languages WHERE LanguageID = ?", [id]);
        await db.query("DELETE FROM Languages WHERE LanguageID = ?", [id]);
        return res.redirect("/admin/languages");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting language.");
    }
});

// ==============================
// ADMIN CATEGORY MANAGEMENT
// ==============================
app.get("/admin/categories", requireAdmin, async function(req, res) {
    try {
        const categories = await db.query("SELECT * FROM Categories ORDER BY Category_Name");
        res.render("admin/categories", { title: "Manage Categories", categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading categories.");
    }
});

app.post("/admin/categories/add", requireAdmin, async function(req, res) {
    const name = (req.body.category_name || "").trim();
    const description = (req.body.description || "").trim();
    if (!name) return res.redirect("/admin/categories");
    try {
        await db.query(
            "INSERT INTO Categories (Category_Name, Description) VALUES (?, ?)",
            [name, description || null]
        );
        return res.redirect("/admin/categories");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding category.");
    }
});

app.post("/admin/categories/:id/delete", requireAdmin, async function(req, res) {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM Language_Categories WHERE CategoryID = ?", [id]);
        await db.query("DELETE FROM Categories WHERE CategoryID = ?", [id]);
        return res.redirect("/admin/categories");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting category.");
    }
});

// ==============================
// AUTH ROUTES
// ==============================
app.get("/login", function(req, res) {
    res.render("login", { title: "Login", error: null, emailOrUsername: "", hideNav: true });
});

app.post("/login", async function(req, res) {
    try {
        const emailOrUsername = (req.body.emailOrUsername || "").trim();
        const password = req.body.password || "";
        if (!emailOrUsername || !password) {
            return res.status(400).render("login", { title: "Login", error: "Please fill in all fields.", emailOrUsername });
        }
        const rows = await db.query(
            "SELECT * FROM Users WHERE Email = ? OR Username = ? LIMIT 1",
            [emailOrUsername, emailOrUsername]
        );
        if (!rows || rows.length === 0) {
            return res.status(401).render("login", { title: "Login", error: "Invalid credentials.", emailOrUsername });
        }
        const user = rows[0];
        if (!user.Password) {
            return res.status(401).render("login", { title: "Login", error: "Invalid credentials.", emailOrUsername });
        }
        const passwordMatch = await bcrypt.compare(password, user.Password);
        if (!passwordMatch) {
            return res.status(401).render("login", { title: "Login", error: "Invalid credentials.", emailOrUsername });
        }
        await db.query("UPDATE Users SET Last_Active = NOW() WHERE UserID = ?", [user.UserID]);
        req.session.user = {
            id: user.UserID,
            name: user.Full_Name,
            email: user.Email,
            role: user.Role,
            profileComplete: !!user.Profile_Complete
        };
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).render("login", { title: "Login", error: "Server error", emailOrUsername: req.body.emailOrUsername || "" });
    }
});

app.get("/signup", function(req, res) {
    res.render("signup", { title: "Sign Up", error: null, form: {}, hideNav: true });
});

app.post("/signup", async function(req, res) {
    try {
        const form = {
            fullName: (req.body.fullName || "").trim(),
            email: (req.body.email || "").trim(),
            username: (req.body.username || "").trim(),
            role: (req.body.role || "").trim(),
            password: req.body.password || ""
        };
        if (!form.fullName || !form.email || !form.username || !form.role || !form.password) {
            return res.status(400).render("signup", { title: "Sign Up", error: "All fields are required.", form });
        }
        const allowedRoles = ["Learner", "Teacher"];
        if (!allowedRoles.includes(form.role)) {
            return res.status(400).render("signup", { title: "Sign Up", error: "Invalid role selected.", form });
        }
        const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,}$/;
        if (!passwordPattern.test(form.password)) {
            return res.status(400).render("signup", {
                title: "Sign Up",
                error: "Password must be at least 9 characters and include uppercase, lowercase, number, and special character.",
                form
            });
        }
        const existing = await db.query(
            "SELECT UserID FROM Users WHERE Email = ? OR Username = ? LIMIT 1",
            [form.email, form.username]
        );
        if (existing && existing.length > 0) {
            return res.status(409).render("signup", { title: "Sign Up", error: "Email or username already exists.", form });
        }
        const hashedPassword = await bcrypt.hash(form.password, SALT_ROUNDS);
        const result = await db.query(
            "INSERT INTO Users (Full_Name, Email, Username, Password, Role) VALUES (?, ?, ?, ?, ?)",
            [form.fullName, form.email, form.username, hashedPassword, form.role]
        );
        if (!result || !result.insertId) throw new Error("User creation failed");
        req.session.user = {
            id: result.insertId,
            name: form.fullName,
            email: form.email,
            role: form.role,
            profileComplete: false
        };
        return res.redirect("/complete-profile");
    } catch (err) {
        console.error(err);
        res.status(500).render("signup", { title: "Sign Up", error: "Server error", form: req.body });
    }
});

// ==============================
// USERS ROUTE
// ==============================
app.get("/users", requireLogin, async function(req, res) {
    try {
        const users = await User.getAllUsers();
        res.render("users", { title: "Users", users: users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
});

// ==============================
// LANGUAGES ROUTE
// ==============================
app.get("/languages", function(req, res) {
    db.query(`SELECT LanguageID, Language_Name FROM Languages`).then(results => {
        res.render("languages", { title: "Languages", languages: results });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading languages");
    });
});

// ==============================
// USER LANGUAGES ROUTE
// ==============================
app.get("/user-languages", requireLogin, function(req, res) {
    db.query(`
        SELECT ul.UserID, u.Full_Name, ul.LanguageID, l.Language_Name
        FROM User_Languages ul
        JOIN Users u ON ul.UserID = u.UserID
        JOIN Languages l ON ul.LanguageID = l.LanguageID
    `).then(results => {
        res.render("user_languages", { title: "User Languages", userLanguages: results });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading user languages");
    });
});

// ==============================
// SESSION REQUEST ROUTES
// ==============================
app.get("/sessions/request/:teacherId", requireLogin, async function(req, res) {
    try {
        const teacher = await User.getUserById(req.params.teacherId);
        if (!teacher) return res.status(404).send("Teacher not found.");
        res.render("session-request-form", { title: "Request a Session", teacher });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading request form.");
    }
});

app.post("/sessions/request", requireLogin, async function(req, res) {
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
});

app.get("/sessions/my", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const rawSessions = await Session.getSessionsForUser(userId);
        const sessions = Session.addPermissions(rawSessions, userId);
        res.render("sessions-my", { title: "My Sessions", sessions, user: req.session.user, reviewed: req.query.reviewed || false });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading your sessions.");
    }
});

app.post("/sessions/:id/accept", requireLogin, async function(req, res) {
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
});

app.post("/sessions/:id/decline", requireLogin, async function(req, res) {
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
});

app.post("/sessions/:id/cancel", requireLogin, async function(req, res) {
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
});

// ==============================
// REVIEWS ROUTE
// ==============================
app.get("/reviews", requireLogin, async function(req, res) {
    try {
        const reviews = await Review.getAllReviews();
        res.render("reviews", { title: "Reviews", reviews: reviews });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reviews");
    }
});

app.get("/reviews/submit/:sessionId", requireLogin, async function(req, res) {
    try {
        const session = await Session.getSessionById(req.params.sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(req.session.user.id)) return res.status(403).send("Only the learner can leave a review.");
        if (session.Status !== "Accepted") return res.status(400).send("You can only review accepted sessions.");
        const existing = await db.query("SELECT ReviewID FROM Reviews WHERE SessionID = ?", [req.params.sessionId]);
        if (existing && existing.length > 0) return res.status(400).send("You have already reviewed this session.");
        res.render("review-form", { title: "Leave a Review", session, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading review form.");
    }
});

app.post("/reviews/submit", requireLogin, async function(req, res) {
    const { sessionId, star_rating, comment } = req.body;
    if (!sessionId || !star_rating) return res.status(400).send("Please fill in all required fields.");
    const rating = parseInt(star_rating);
    if (rating < 1 || rating > 5) return res.status(400).send("Rating must be between 1 and 5.");
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(req.session.user.id)) return res.status(403).send("Only the learner can leave a review.");
        if (session.Status !== "Accepted") return res.status(400).send("You can only review accepted sessions.");
        const existing = await db.query("SELECT ReviewID FROM Reviews WHERE SessionID = ?", [sessionId]);
        if (existing && existing.length > 0) return res.status(400).send("You have already reviewed this session.");
        await db.query(`INSERT INTO Reviews (SessionID, Star_Rating, Comment) VALUES (?, ?, ?)`, [sessionId, rating, comment || null]);
        return res.redirect("/sessions/my?reviewed=true");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error submitting review.");
    }
});

// ==============================
// REPORTS ROUTE
// ==============================
app.get("/reports", requireLogin, async function(req, res) {
    try {
        const reports = await Report.getAllReports();
        res.render("reports", { title: "Reports", reports: reports });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reports");
    }
});

app.get("/reports/submit/:userId", requireLogin, async function(req, res) {
    try {
        const reportedUser = await User.getUserById(req.params.userId);
        if (!reportedUser) return res.status(404).send("User not found.");
        if (String(req.session.user.id) === String(req.params.userId)) return res.status(400).send("You cannot report yourself.");
        res.render("report-form", { title: "Submit a Report", reportedUser, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading report form.");
    }
});

app.post("/reports/submit", requireLogin, async function(req, res) {
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
});

// ==============================
// PLATFORM OVERVIEW ROUTE
// ==============================
app.get("/platform", async function(req, res) {
    try {
        const totalUsersRow = await db.query("SELECT COUNT(*) AS total FROM Users");
        const totalLanguagesRow = await db.query("SELECT COUNT(*) AS total FROM Languages");
        const totalSessionsRow = await db.query("SELECT COUNT(*) AS total FROM Learning_Sessions");
        const pendingReportsRow = await db.query("SELECT COUNT(*) AS total FROM Reports WHERE Status = 'Pending'");
        const recentSessions = await db.query(
            `SELECT ls.SessionID, learner.Full_Name AS LearnerName, teacher.Full_Name AS TeacherName, ls.Status
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             ORDER BY ls.SessionID DESC LIMIT 5`
        );
        res.render("platform", {
            title: "Platform Overview",
            stats: {
                totalUsers: totalUsersRow[0].total,
                totalLanguages: totalLanguagesRow[0].total,
                totalSessions: totalSessionsRow[0].total,
                pendingReports: pendingReportsRow[0].total
            },
            recentSessions
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading platform overview.");
    }
});

// ==============================
// USER PROFILE ROUTE
// ==============================
app.get("/users/:id", requireLogin, async (req, res) => {
    const userId = req.params.id;
    try {
        const user = await User.getUserById(userId);
        if (!user) return res.status(404).send("User not found");
        const [languages, availability, interests, preferences] = await Promise.all([
            User.getUserLanguages(userId),
            User.getUserAvailability(userId),
            User.getUserInterests(userId),
            User.getUserPreferences(userId)
        ]);
        res.render("profile", { title: "User Profile", user, languages, availability, interests, preferences, reported: req.query.reported || false });
    } catch (error) {
        console.error("PROFILE ROUTE ERROR:", error);
        res.status(500).send("Error loading profile");
    }
});

// ==============================
// CATEGORIES ROUTE
// ==============================
app.get("/categories", requireLogin, async (req, res) => {
    try {
        const rows = await Category.getAllCategoriesWithLanguages();
        const categoriesMap = {};
        rows.forEach(row => {
            if (!categoriesMap[row.CategoryID]) {
                categoriesMap[row.CategoryID] = {
                    CategoryID: row.CategoryID,
                    Category_Name: row.Category_Name,
                    Description: row.Description,
                    languages: []
                };
            }
            if (row.Language_Name) categoriesMap[row.CategoryID].languages.push(row.Language_Name);
        });
        res.render("categories", { title: "Categories", categories: Object.values(categoriesMap) });
    } catch (error) {
        console.error("CATEGORIES ROUTE ERROR:", error);
        res.status(500).send("Error loading categories");
    }
});

// ==============================
// SEARCH ROUTE
// ==============================
app.get("/search", requireLogin, async function(req, res) {
    const query = (req.query.query || "").trim();
    try {
        const users = query ? await User.search(query) : [];
        res.render("search", { title: "Search Results", users, query });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading search results");
    }
});

// ==============================
// CATEGORY SUGGESTIONS API
// ==============================
app.get("/api/categories", async function(req, res) {
    const q = (req.query.q || "").trim();
    try {
        const sql = q
            ? "SELECT CategoryID, Category_Name FROM Categories WHERE Category_Name LIKE ? LIMIT 5"
            : "SELECT CategoryID, Category_Name FROM Categories";
        const params = q ? [`%${q}%`] : [];
        const rows = await db.query(sql, params);
        res.json(rows);
    } catch (err) {
        console.error(err);
        res.status(500).json([]);
    }
});

// ==============================
// COMPLETE PROFILE ROUTE
// ==============================
app.get("/complete-profile", requireLogin, async function(req, res) {
    const languages = await db.query("SELECT LanguageID, Language_Name FROM Languages");
    res.render("complete-profile", { title: "Complete Profile", languages, error: null });
});

app.post("/complete-profile", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const langIds = [].concat(req.body.languageId || []);
        const langTypes = [].concat(req.body.language_type || []);
        const profLevels = [].concat(req.body.proficiency_level || []);
        for (let i = 0; i < langIds.length; i++) {
            if (!langIds[i]) continue;
            await db.query(
                "INSERT INTO User_Languages (UserID, LanguageID, Language_Type, Proficiency_Level) VALUES (?, ?, ?, ?)",
                [userId, langIds[i], langTypes[i], profLevels[i]]
            );
        }
        const days = [].concat(req.body.day_of_week || []);
        const starts = [].concat(req.body.start_time || []);
        const ends = [].concat(req.body.end_time || []);
        const timezones = [].concat(req.body.time_zone || []);
        for (let i = 0; i < days.length; i++) {
            if (!days[i]) continue;
            await db.query(
                "INSERT INTO User_Availability (UserID, Day_Of_Week, Start_Time, End_Time, Time_Zone) VALUES (?, ?, ?, ?, ?)",
                [userId, days[i], starts[i], ends[i], timezones[i]]
            );
        }
        const interests = [].concat(req.body.interest_name || []);
        for (let interest of interests) {
            if (!interest.trim()) continue;
            await db.query("INSERT INTO User_Interests (UserID, Interest_Name) VALUES (?, ?)", [userId, interest.trim()]);
        }
        await db.query(
            "INSERT INTO User_Preferences (UserID, Practice_Method, Preferred_Session_Type, Learning_Goal) VALUES (?, ?, ?, ?)",
            [userId, req.body.practice_method, req.body.preferred_session_type, req.body.learning_goal]
        );
        await db.query("UPDATE Users SET Profile_Complete = 1 WHERE UserID = ?", [userId]);
        req.session.user.profileComplete = true;
        return res.redirect("/users/" + userId);
    } catch (err) {
        console.error(err);
        const languages = await db.query("SELECT LanguageID, Language_Name FROM Languages");
        res.status(500).render("complete-profile", { title: "Complete Profile", languages, error: "Something went wrong. Try again." });
    }
});

// ==============================
// LOGOUT ROUTE
// ==============================
app.get("/logout", async function(req, res) {
    try {
        if (!req.session.user) return res.redirect('/login');
        const userId = req.session.user.id;
        await db.query("UPDATE Users SET Last_Active = NOW() WHERE UserID = ?", [userId]);
        req.session.destroy(err => {
            if (err) console.error('Session destroy error', err);
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Logout failed");
    }
});

app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000`);
});