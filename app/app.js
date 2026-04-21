require('dotenv').config();

// Import express.js
const express = require("express");

// Create express app
var app = express();

// Use the Pug templating engine
app.set('view engine', 'pug');
app.set('views', './app/views');

// Add static files location
app.use(express.static("static"));

// Add body parsing so POST requests work
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Add session support
const session = require('express-session');
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000, httpOnly: true }
}));

// Provide current user in templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// ==============================
// ADMIN MIDDLEWARE
// ==============================
function requireAdmin(req, res, next) {
    if (!req.session.user || req.session.user.role !== 'Admin') {
        return res.status(403).send("Access denied.");
    }
    next();
}

// ==============================
// LOGIN MIDDLEWARE
// ==============================
function requireLogin(req, res, next) {
    if (!req.session.user) return res.redirect("/login");
    next();
}

// Get the functions in the db.js file to use
const db = require('./services/db');

// Use bcrypt for password hashing and verification
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Import model classes
const { User } = require('./models/userModel');
const { Category } = require('./models/categoryModel');
const { Report } = require('./models/reportModel');
const { Review } = require('./models/reviewModel');
const { Admin } = require('./models/adminModel');

// HOME ROUTE
app.get("/", function(req, res) {
    res.render("home", { title: "Home" });
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

// ==============================
// AUTH ROUTES
// ==============================
app.get("/login", function(req, res) {
    res.render("login", { title: "Login", error: null, emailOrUsername: "", hideNav: true });
});

app.post("/login", async function(req, res) {
    try {
        const emailOrUsername = (req.body.emailOrUsername || "").trim();
        const password = (req.body.password || "").trim();

        if (!emailOrUsername || !password) {
            return res.status(400).render("login", {
                title: "Login",
                error: "Please fill in all fields.",
                emailOrUsername
            });
        }

        const sql = "SELECT * FROM Users WHERE Email = ? OR Username = ? LIMIT 1";
        const rows = await db.query(sql, [emailOrUsername, emailOrUsername]);

        if (!rows || rows.length === 0) {
            return res.status(401).render("login", {
                title: "Login",
                error: "Invalid credentials.",
                emailOrUsername
            });
        }

        const user = rows[0];

        if (!user.Password) {
            return res.status(401).render("login", {
                title: "Login",
                error: "Invalid credentials.",
                emailOrUsername
            });
        }

        const passwordMatch = await bcrypt.compare(password, user.Password);
        if (!passwordMatch) {
            return res.status(401).render("login", {
                title: "Login",
                error: "Invalid credentials.",
                emailOrUsername
            });
        }

        const updateLastActiveSql = "UPDATE Users SET Last_Active = NOW() WHERE UserID = ?";
        await db.query(updateLastActiveSql, [user.UserID]);

        req.session.user = {
            id: user.UserID,
            name: user.Full_Name,
            email: user.Email,
            role: user.Role
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
            password: (req.body.password || "").trim()
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

        const existingSql = "SELECT UserID FROM Users WHERE Email = ? OR Username = ? LIMIT 1";
        const existing = await db.query(existingSql, [form.email, form.username]);

        if (existing && existing.length > 0) {
            return res.status(409).render("signup", { title: "Sign Up", error: "Email or username already exists.", form });
        }

        const hashedPassword = await bcrypt.hash(form.password, SALT_ROUNDS);

        const insertSql = "INSERT INTO Users (Full_Name, Email, Username, Password, Role) VALUES (?, ?, ?, ?, ?)";
        const result = await db.query(insertSql, [form.fullName, form.email, form.username, hashedPassword, form.role]);

        if (!result || !result.insertId) {
            throw new Error("User creation failed");
        }

        req.session.user = {
            id: result.insertId,
            name: form.fullName,
            email: form.email,
            role: form.role
        };
        return res.redirect("/complete-profile");
    } catch (err) {
        console.error(err);
        res.status(500).render("signup", { title: "Sign Up", error: "Server error", form: req.body });
    }
});

// ==============================
// USERS ROUTE — protected
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
    var sql = `SELECT LanguageID, Language_Name FROM Languages`;
    db.query(sql).then(results => {
        res.render("languages", { title: "Languages", languages: results });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading languages");
    });
});

// ==============================
// USER LANGUAGES ROUTE — protected
// ==============================
app.get("/user-languages", requireLogin, function(req, res) {
    var sql = `
        SELECT 
            ul.UserID,
            u.Full_Name,
            ul.LanguageID,
            l.Language_Name
        FROM User_Languages ul
        JOIN Users u ON ul.UserID = u.UserID
        JOIN Languages l ON ul.LanguageID = l.LanguageID
    `;
    db.query(sql).then(results => {
        res.render("user_languages", { title: "User Languages", userLanguages: results });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading user languages");
    });
});

// ==============================
// SESSION REQUEST ROUTES
// ==============================
app.get("/sessions/request/:teacherId", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    try {
        const teacher = await User.getUserById(req.params.teacherId);
        if (!teacher) return res.status(404).send("Teacher not found.");
        res.render("session-request-form", { title: "Request a Session", teacher });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading request form.");
    }
});

app.post("/sessions/request", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");

    const learnerId = req.session.user.id;
    const { teacherId, meeting_place, scheduled_time, initial_message } = req.body;

    if (!teacherId || !meeting_place || !scheduled_time) {
        return res.status(400).send("Please fill in all required fields.");
    }

    if (String(learnerId) === String(teacherId)) {
        return res.status(400).send("You cannot send a session request to yourself.");
    }

    try {
        await db.query(
            `INSERT INTO Learning_Sessions (LearnerID, TeacherID, Meeting_Place, Scheduled_Time, Initial_Message, Status)
             VALUES (?, ?, ?, ?, ?, 'Pending')`,
            [learnerId, teacherId, meeting_place, scheduled_time, initial_message || null]
        );
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error sending session request.");
    }
});

app.get("/sessions/my", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");

    const userId = req.session.user.id;
    try {
        const sessions = await db.query(
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
        res.render("sessions-my", { title: "My Sessions", sessions, user: req.session.user });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading your sessions.");
    }
});

app.post("/sessions/:id/accept", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const rows = await db.query("SELECT * FROM Learning_Sessions WHERE SessionID = ?", [sessionId]);
        if (!rows || rows.length === 0) return res.status(404).send("Session not found.");
        const session = rows[0];
        if (String(session.TeacherID) !== String(userId)) {
            return res.status(403).send("Only the teacher can accept this request.");
        }
        if (session.Status !== "Pending") {
            return res.status(400).send("This session is no longer pending.");
        }
        await db.query("UPDATE Learning_Sessions SET Status = 'Accepted' WHERE SessionID = ?", [sessionId]);
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error accepting session.");
    }
});

app.post("/sessions/:id/decline", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const rows = await db.query("SELECT * FROM Learning_Sessions WHERE SessionID = ?", [sessionId]);
        if (!rows || rows.length === 0) return res.status(404).send("Session not found.");
        const session = rows[0];
        if (String(session.TeacherID) !== String(userId)) {
            return res.status(403).send("Only the teacher can decline this request.");
        }
        if (session.Status !== "Pending") {
            return res.status(400).send("This session is no longer pending.");
        }
        await db.query("UPDATE Learning_Sessions SET Status = 'Declined' WHERE SessionID = ?", [sessionId]);
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error declining session.");
    }
});

app.post("/sessions/:id/cancel", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    const userId = req.session.user.id;
    const sessionId = req.params.id;
    try {
        const rows = await db.query("SELECT * FROM Learning_Sessions WHERE SessionID = ?", [sessionId]);
        if (!rows || rows.length === 0) return res.status(404).send("Session not found.");
        const session = rows[0];
        if (String(session.LearnerID) !== String(userId)) {
            return res.status(403).send("Only the learner can cancel this request.");
        }
        if (session.Status !== "Pending") {
            return res.status(400).send("Only pending sessions can be cancelled.");
        }
        await db.query("UPDATE Learning_Sessions SET Status = 'Cancelled' WHERE SessionID = ?", [sessionId]);
        return res.redirect("/sessions/my");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error cancelling session.");
    }
});

// ==============================
// REVIEWS ROUTE
// ==============================
app.get("/reviews", async function(req, res) {
    try {
        const reviews = await Review.getAllReviews();
        res.render("reviews", { title: "Reviews", reviews: reviews });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reviews");
    }
});

// ==============================
// REPORTS ROUTE — protected
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
// GET /reports/submit/:userId — show report form
app.get("/reports/submit/:userId", requireLogin, async function(req, res) {
    try {
        const reportedUser = await User.getUserById(req.params.userId);
        if (!reportedUser) return res.status(404).send("User not found.");
        if (String(req.session.user.id) === String(req.params.userId)) {
            return res.status(400).send("You cannot report yourself.");
        }
        res.render("report-form", { title: "Submit a Report", reportedUser, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading report form.");
    }
});

// POST /reports/submit — save report to database
app.post("/reports/submit", requireLogin, async function(req, res) {
    const reporterId = req.session.user.id;
    const { reportedUserId, reason } = req.body;

    if (!reportedUserId || !reason || !reason.trim()) {
        return res.status(400).send("Please provide a reason for the report.");
    }

    if (String(reporterId) === String(reportedUserId)) {
        return res.status(400).send("You cannot report yourself.");
    }

    try {
        await db.query(
            `INSERT INTO Reports (ReporterID, ReportedUserID, Reason, Status)
             VALUES (?, ?, ?, 'Pending')`,
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
app.get("/platform", function(req, res) {
    res.render("platform", {
        title: "Platform Overview",
        stats: {
            totalUsers: 10,
            totalLanguages: 5,
            totalSessions: 8,
            pendingReports: 2
        },
        recentSessions: [
            { SessionID: 1, LearnerName: "Sangit", TeacherName: "Asha", Status: "Pending" },
            { SessionID: 2, LearnerName: "Ram", TeacherName: "Asha", Status: "Accepted" }
        ]
    });
});

// ==============================
// USER PROFILE ROUTE
// ==============================
app.get("/users/:id", async (req, res) => {
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
app.get("/categories", async (req, res) => {
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
            if (row.Language_Name) {
                categoriesMap[row.CategoryID].languages.push(row.Language_Name);
            }
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
app.get("/search", async function(req, res) {
    const language = (req.query.language || "").trim();
    try {
        const users = language ? await User.searchByLanguage(language) : [];
        res.render("search", { title: "Search Results", users, query: language });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading search results");
    }
});

// ==============================
// COMPLETE PROFILE ROUTE
// ==============================
app.get("/complete-profile", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    const languages = await db.query("SELECT LanguageID, Language_Name FROM Languages");
    res.render("complete-profile", { title: "Complete Profile", languages, error: null });
});

app.post("/complete-profile", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
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
            await db.query(
                "INSERT INTO User_Interests (UserID, Interest_Name) VALUES (?, ?)",
                [userId, interest.trim()]
            );
        }
        await db.query(
            "INSERT INTO User_Preferences (UserID, Practice_Method, Preferred_Session_Type, Learning_Goal) VALUES (?, ?, ?, ?)",
            [userId, req.body.practice_method, req.body.preferred_session_type, req.body.learning_goal]
        );
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
        const updateLastActiveSql = "UPDATE Users SET Last_Active = NOW() WHERE UserID = ?";
        await db.query(updateLastActiveSql, [userId]);
        req.session.destroy(err => {
            if (err) console.error('Session destroy error', err);
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Logout failed");
    }
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000`);
});