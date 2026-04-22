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

// ==============================
// MIDDLEWARE
// ==============================
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
const { User } = require('./models/userModel');
const { Category } = require('./models/categoryModel');

// ==============================
// IMPORT ROUTES
// ==============================
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const sessionRoutes = require('./routes/sessionRoutes');
const messageRoutes = require('./routes/messageRoutes');
const reviewRoutes = require('./routes/reviewRoutes');
const reportRoutes = require('./routes/reportRoutes');
const adminRoutes = require('./routes/adminRoutes');

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
    const { Session } = require('./models/sessionModel');
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
        res.render("dashboard", { title: "My Dashboard", user, languages, pending, upcoming, reviews, stats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard.");
    }
});

// ==============================
// LANGUAGES ROUTE (public)
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
// SETTINGS ROUTE
// ==============================
app.get("/settings", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const user = await User.getUserById(userId);
        const languages = await User.getUserLanguages(userId);
        const preferences = await User.getUserPreferences(userId);
        const allLanguages = await db.query("SELECT LanguageID, Language_Name FROM Languages ORDER BY Language_Name");
        res.render("settings", { title: "Settings", user, languages, preferences, allLanguages, error: null, success: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading settings.");
    }
});

app.post("/settings/profile", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    const bio = (req.body.bio || "").trim();
    const country = (req.body.country || "").trim();
    const profileImage = (req.body.profile_image || "").trim();
    try {
        await db.query(
            "UPDATE Users SET Bio = ?, Country = ?, Profile_Image = ? WHERE UserID = ?",
            [bio || null, country || null, profileImage || null, userId]
        );
        return res.redirect("/settings?success=profile");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating profile.");
    }
});

app.post("/settings/account", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    const username = (req.body.username || "").trim();
    const email = (req.body.email || "").trim();
    try {
        const existing = await db.query(
            "SELECT UserID FROM Users WHERE (Username = ? OR Email = ?) AND UserID != ? LIMIT 1",
            [username, email, userId]
        );
        if (existing && existing.length > 0) {
            const user = await User.getUserById(userId);
            const languages = await User.getUserLanguages(userId);
            const preferences = await User.getUserPreferences(userId);
            const allLanguages = await db.query("SELECT LanguageID, Language_Name FROM Languages ORDER BY Language_Name");
            return res.render("settings", { title: "Settings", user, languages, preferences, allLanguages, error: "Username or email already taken.", success: null });
        }
        await db.query(
            "UPDATE Users SET Username = ?, Email = ? WHERE UserID = ?",
            [username, email, userId]
        );
        req.session.user.email = email;
        return res.redirect("/settings?success=account");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating account.");
    }
});

app.post("/settings/password", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    const currentPassword = req.body.current_password || "";
    const newPassword = req.body.new_password || "";
    try {
        const rows = await db.query("SELECT Password FROM Users WHERE UserID = ?", [userId]);
        const passwordMatch = await bcrypt.compare(currentPassword, rows[0].Password);
        if (!passwordMatch) {
            const user = await User.getUserById(userId);
            const languages = await User.getUserLanguages(userId);
            const preferences = await User.getUserPreferences(userId);
            const allLanguages = await db.query("SELECT LanguageID, Language_Name FROM Languages ORDER BY Language_Name");
            return res.render("settings", { title: "Settings", user, languages, preferences, allLanguages, error: "Current password is incorrect.", success: null });
        }
        const passwordPattern = /^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{9,}$/;
        if (!passwordPattern.test(newPassword)) {
            const user = await User.getUserById(userId);
            const languages = await User.getUserLanguages(userId);
            const preferences = await User.getUserPreferences(userId);
            const allLanguages = await db.query("SELECT LanguageID, Language_Name FROM Languages ORDER BY Language_Name");
            return res.render("settings", { title: "Settings", user, languages, preferences, allLanguages, error: "Password must be at least 9 characters with uppercase, lowercase, number and special character.", success: null });
        }
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        await db.query("UPDATE Users SET Password = ? WHERE UserID = ?", [hashedPassword, userId]);
        return res.redirect("/settings?success=password");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating password.");
    }
});

app.post("/settings/preferences", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        const existing = await db.query("SELECT UserID FROM User_Preferences WHERE UserID = ?", [userId]);
        if (existing && existing.length > 0) {
            await db.query(
                "UPDATE User_Preferences SET Practice_Method = ?, Preferred_Session_Type = ?, Learning_Goal = ? WHERE UserID = ?",
                [req.body.practice_method, req.body.preferred_session_type, req.body.learning_goal, userId]
            );
        } else {
            await db.query(
                "INSERT INTO User_Preferences (UserID, Practice_Method, Preferred_Session_Type, Learning_Goal) VALUES (?, ?, ?, ?)",
                [userId, req.body.practice_method, req.body.preferred_session_type, req.body.learning_goal]
            );
        }
        return res.redirect("/settings?success=preferences");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating preferences.");
    }
});

app.post("/settings/languages/add", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    const { languageId, language_type, proficiency_level } = req.body;
    if (!languageId) return res.redirect("/settings");
    try {
        await db.query(
            "INSERT INTO User_Languages (UserID, LanguageID, Language_Type, Proficiency_Level) VALUES (?, ?, ?, ?)",
            [userId, languageId, language_type, proficiency_level]
        );
        return res.redirect("/settings?success=languages");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error adding language.");
    }
});

app.post("/settings/languages/:languageId/delete", requireLogin, async function(req, res) {
    const userId = req.session.user.id;
    try {
        await db.query(
            "DELETE FROM User_Languages WHERE UserID = ? AND LanguageID = ?",
            [userId, req.params.languageId]
        );
        return res.redirect("/settings?success=languages");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error removing language.");
    }
});

// ==============================
// WIRE UP ROUTES WITH MIDDLEWARE
// ==============================
app.use('/', authRoutes);
app.use('/', requireLogin, userRoutes);
app.use('/', requireLogin, sessionRoutes);
app.use('/', requireLogin, messageRoutes);
app.use('/', requireLogin, reviewRoutes);
app.use('/', requireLogin, reportRoutes);
app.use('/', requireAdmin, adminRoutes);

app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000`);
});