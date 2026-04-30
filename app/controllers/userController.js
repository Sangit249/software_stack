const { User } = require('../models/userModel');
const db = require('../services/db');

exports.getUsers = async (req, res) => {
    try {
        const users = await User.getAllUsers();
        res.render("users", { title: "Users", users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
};

exports.getProfile = async (req, res) => {
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
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading profile");
    }
};

exports.getCompleteProfile = async (req, res) => {
    try {
        const languages = await db.query("SELECT LanguageID, Language_Name FROM Languages");
        res.render("complete-profile", { title: "Complete Profile", languages, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading profile form");
    }
};

exports.postCompleteProfile = async (req, res) => {
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
};

exports.getSearch = async (req, res) => {
    const query = (req.query.query || "").trim();
    try {
        const users = query ? await User.search(query) : [];
        res.render("search", { title: "Search Results", users, query });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading search results");
    }
};