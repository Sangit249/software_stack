const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const db = require('../services/db');
const { User } = require('../models/userModel');

// ==============================
// SETTINGS ROUTE
// ==============================
router.get("/settings", async function(req, res) {
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

router.post("/settings/profile", async function(req, res) {
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

router.post("/settings/account", async function(req, res) {
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

router.post("/settings/password", async function(req, res) {
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

router.post("/settings/preferences", async function(req, res) {
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

router.post("/settings/languages/add", async function(req, res) {
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

router.post("/settings/languages/:languageId/delete",async function(req, res) {
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

module.exports = router;