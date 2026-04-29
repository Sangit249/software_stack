const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;
const db = require('../services/db');

exports.getLogin = (req, res) => {
    res.render("login", { title: "Login", error: null, emailOrUsername: "", hideNav: true });
};

exports.postLogin = async (req, res) => {
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
        if (user.Suspended) {
            return res.status(403).render("login", {
                title: "Login",
                error: "Your account has been suspended. Please contact support.",
                emailOrUsername
            });
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
        return res.redirect(user.Role === 'Admin' ? "/admin" : "/");
    } catch (err) {
        console.error(err);
        res.status(500).render("login", { title: "Login", error: "Server error", emailOrUsername: req.body.emailOrUsername || "" });
    }
};

exports.getSignup = (req, res) => {
    res.render("signup", { title: "Sign Up", error: null, form: {}, hideNav: true });
};

exports.postSignup = async (req, res) => {
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
};

exports.getLogout = async (req, res) => {
    try {
        if (!req.session.user) return res.redirect('/login');
        await db.query("UPDATE Users SET Last_Active = NOW() WHERE UserID = ?", [req.session.user.id]);
        req.session.destroy(err => {
            if (err) console.error('Session destroy error', err);
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Logout failed");
    }
};