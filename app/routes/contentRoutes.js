const express = require('express');
const router = express.Router();
const db = require('../services/db');
const { User } = require('../models/userModel');
const { Category } = require('../models/categoryModel');
const { Session } = require('../models/sessionModel');


// ==============================
// DASHBOARD ROUTE
// ==============================
router.get("/dashboard", async function(req, res) {
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
        res.render("dashboard", { title: "My Dashboard", user, languages, pending, upcoming, reviews, stats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading dashboard.");
    }
});

// ==============================
// LANGUAGES ROUTE (public)
// ==============================
router.get("/languages", function(req, res) {
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
router.get("/user-languages", function(req, res) {
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
router.get("/platform", async function(req, res) {
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
router.get("/categories", async (req, res) => {
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
router.get("/api/categories", async function(req, res) {
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




module.exports = router;