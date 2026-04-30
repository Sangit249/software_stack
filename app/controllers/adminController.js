const { Admin } = require('../models/adminModel');
const { Language } = require('../models/languageModel');
const db = require('../services/db');

exports.getDashboard = async (req, res) => {
    try {
        const stats = await Admin.getStats();
        res.render("admin/dashboard", { title: "Admin Dashboard", stats });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading admin dashboard");
    }
};

exports.getUsers = async (req, res) => {
    try {
        const users = await Admin.getAllUsers();
        res.render("admin/users", { title: "Manage Users", users });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
};

exports.deleteUser = async (req, res) => {
    try {
        await Admin.deleteUser(req.params.id);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting user");
    }
};

exports.updateUserRole = async (req, res) => {
    try {
        const allowedRoles = ["Learner", "Teacher", "Admin"];
        if (!allowedRoles.includes(req.body.role)) return res.status(400).send("Invalid role");
        await Admin.updateUserRole(req.params.id, req.body.role);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error updating role");
    }
};

exports.suspendUser = async (req, res) => {
    try {
        await db.query("UPDATE Users SET Suspended = 1 WHERE UserID = ?", [req.params.id]);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error suspending user.");
    }
};

exports.unsuspendUser = async (req, res) => {
    try {
        await db.query("UPDATE Users SET Suspended = 0 WHERE UserID = ?", [req.params.id]);
        return res.redirect("/admin/users");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error unsuspending user.");
    }
};

exports.getReports = async (req, res) => {
    try {
        const reports = await Admin.getAllReports();
        res.render("admin/reports", { title: "Manage Reports", reports });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reports");
    }
};

exports.resolveReport = async (req, res) => {
    try {
        await db.query("UPDATE Reports SET Status = 'Resolved' WHERE ReportID = ?", [req.params.id]);
        return res.redirect("/admin/reports");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error resolving report.");
    }
};

exports.dismissReport = async (req, res) => {
    try {
        await db.query("UPDATE Reports SET Status = 'Dismissed' WHERE ReportID = ?", [req.params.id]);
        return res.redirect("/admin/reports");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error dismissing report.");
    }
};

exports.getLanguages = async (req, res) => {
    try {
        const languages = await Language.getAllWithCategories();
        const categories = await db.query("SELECT * FROM Categories ORDER BY Category_Name");
        res.render("admin/languages", { title: "Manage Languages", languages, categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading languages.");
    }
};

exports.addLanguage = async (req, res) => {
    const name = (req.body.language_name || "").trim();
    const categoryId = req.body.category_id || null;
    if (!name) return res.redirect("/admin/languages");
    try {
        await Language.add(name, categoryId);
        return res.redirect("/admin/languages");
    } catch (err) {
        if (err.code === 'ER_DUP_ENTRY') {
            const languages = await Language.getAllWithCategories();
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
};

exports.deleteLanguage = async (req, res) => {
    try {
        await Language.delete(req.params.id);
        return res.redirect("/admin/languages");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting language.");
    }
};

exports.getCategories = async (req, res) => {
    try {
        const categories = await db.query("SELECT * FROM Categories ORDER BY Category_Name");
        res.render("admin/categories", { title: "Manage Categories", categories });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading categories.");
    }
};

exports.addCategory = async (req, res) => {
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
};

exports.deleteCategory = async (req, res) => {
    const id = req.params.id;
    try {
        await db.query("DELETE FROM Language_Categories WHERE CategoryID = ?", [id]);
        await db.query("DELETE FROM Categories WHERE CategoryID = ?", [id]);
        return res.redirect("/admin/categories");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error deleting category.");
    }
};

exports.getSessions = async (req, res) => {
    try {
        const sessions = await db.query(
            `SELECT ls.SessionID, ls.Status, ls.Scheduled_Time, ls.Meeting_Place,
                learner.Full_Name AS LearnerName,
                teacher.Full_Name AS TeacherName
             FROM Learning_Sessions ls
             JOIN Users learner ON ls.LearnerID = learner.UserID
             JOIN Users teacher ON ls.TeacherID = teacher.UserID
             ORDER BY ls.SessionID DESC`
        );
        res.render("admin/sessions", { title: "All Sessions", sessions });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading sessions.");
    }
};