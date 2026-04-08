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

// Add session support so we can render logout link correctly after login
const session = require('express-session');
app.use(session({
    secret: 'your-super-secret-key',
    resave: false,
    saveUninitialized: true,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }
}));

// Provide current user in templates
app.use((req, res, next) => {
    res.locals.currentUser = req.session.user || null;
    next();
});

// Get the functions in the db.js file to use
const db = require('./services/db');

// Use bcrypt for password hashing and verification
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // cost factor for bcrypt hashing

// Import model classes for various database entities
const { User } = require('./models/userModel');
const { Category } = require('./models/categoryModel');
const { Report } = require('./models/reportModel');
const { Review } = require('./models/reviewModel');

// HOME ROUTE

app.get("/", function(req, res) {
    res.render("home", { title: "Home" });
});

// ==============================
// AUTH ROUTES (Login + Signup + Logout)
// ==============================

// GET /login - display the login page
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
            // Invalid password: show generic error (don't leak which field is wrong)
            return res.status(401).render("login", {
                title: "Login",
                error: "Invalid credentials.",
                emailOrUsername
            });
        }

        // Successful login: update last active timestamp in Users table
        const updateLastActiveSql = "UPDATE Users SET Last_Active = NOW() WHERE UserID = ?";
        await db.query(updateLastActiveSql, [user.UserID]);

        // Save user identity in session for navigation and logout
        req.session.user = {
            id: user.UserID,
            name: user.Full_Name,
            email: user.Email
        };

        // Log in success. Redirect to home page.
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
            // Enforce strong password policy
            return res.status(400).render("signup", {
                title: "Sign Up",
                error: "Password must be at least 9 characters and include uppercase, lowercase, number, and special character.",
                form
            });
        }

        // Prevent duplicate accounts by email or username
        const existingSql = "SELECT UserID FROM Users WHERE Email = ? OR Username = ? LIMIT 1";
        const existing = await db.query(existingSql, [form.email, form.username]);

        if (existing && existing.length > 0) {
            return res.status(409).render("signup", { title: "Sign Up", error: "Email or username already exists.", form });
        }

        const hashedPassword = await bcrypt.hash(form.password, SALT_ROUNDS); // hash pwd before saving

        // Save user account record with hashed password.
        const insertSql = "INSERT INTO Users (Full_Name, Email, Username, Password, Role) VALUES (?, ?, ?, ?, ?)";
        const result = await db.query(insertSql, [form.fullName, form.email, form.username, hashedPassword, form.role]);

        if (!result || !result.insertId) {
            throw new Error("User creation failed");
        }

        
         // Auto-login and redirect to profile completion
        req.session.user = {
            id: result.insertId,
            name: form.fullName,
            email: form.email
        };
        return res.redirect("/complete-profile");
    } catch (err) {
        console.error(err);
        res.status(500).render("signup", { title: "Sign Up", error: "Server error", form: req.body });
    }
});

// ==============================
// USERS ROUTE
// URL: /users
// PUG: users.pug
// ==============================
app.get("/users", async function(req, res) {
    try {
        const users = await User.getAllUsers();

        res.render("users", {
            title: "Users",
            users: users
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading users");
    }
}); 

// ==============================
// LANGUAGES ROUTE
// URL: /languages
// PUG: languages.pug
// ==============================
app.get("/languages", function(req, res) {
    var sql = `
        SELECT LanguageID, Language_Name
        FROM Languages
    `;

    db.query(sql).then(results => {
        res.render("languages", {
            title: "Languages",
            languages: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading languages");
    });
});


// ==============================
// USER LANGUAGES ROUTE
// URL: /user-languages
// PUG: user_languages.pug
// ==============================
app.get("/user-languages", function(req, res) {
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
        res.render("user_languages", {
            title: "User Languages",
            userLanguages: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading user languages");
    });
});


// ==============================
// SESSIONS ROUTE
// URL: /sessions
// PUG: sessions.pug
// ==============================
app.get("/sessions", function(req, res) {
    var sql = `
        SELECT 
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
    `;

    db.query(sql).then(results => {
        res.render("sessions", {
            title: "Learning Sessions",
            sessions: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading sessions");
    });
});


// ==============================
// REVIEWS ROUTE
// URL: /reviews
// PUG: reviews.pug
// ==============================
app.get("/reviews", async function(req, res) {
    try {
        const reviews = await Review.getAllReviews();

        res.render("reviews", {
            title: "Reviews",
            reviews: reviews
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reviews");
    }
});


// ==============================
// REPORTS ROUTE
// URL: /reports
// PUG: reports.pug
// ==============================
app.get("/reports", async function(req, res) {
    try {
        const reports = await Report.getAllReports();

        res.render("reports", {
            title: "Reports",
            reports: reports
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reports");
    }
});

// routes for a  about page 
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

// routes for a  profile page 
app.get("/users/:id", async (req, res) => {
    const userId = req.params.id;

    try {
        const user = await User.getUserById(userId);

        if (!user) {
            return res.status(404).send("User not found");
        }

        const [languages, availability, interests, preferences] = await Promise.all([
            User.getUserLanguages(userId),
            User.getUserAvailability(userId),
            User.getUserInterests(userId),
            User.getUserPreferences(userId)
        ]);

        res.render("profile", {
            title: "User Profile",
            user,
            languages,
            availability,
            interests,
            preferences
        });
    } catch (error) {
        console.error("PROFILE ROUTE ERROR:", error);
        res.status(500).send("Error loading profile");
    }
});

// routes for a   language categories
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

        const categories = Object.values(categoriesMap);

        res.render("categories", {
            title: "Categories",
            categories
        });
    } catch (error) {
        console.error("CATEGORIES ROUTE ERROR:", error);
        res.status(500).send("Error loading categories");
    }
});

// Task 2 display a formatted list of students
app.get("/students", function(req, res) {
    var sql = 'select * from Students';
    db.query(sql).then(results => {
        res.render('all-students', { data: results });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading students");
    });
});

// create a route for a single student page 
app.get("/student-single/:id", function(req, res) {
    var sId = req.params.id;
    var sql = "SELECT * FROM Students WHERE id = ?";
    db.query(sql, [sId]).then(results => {
        res.render("student-single", { "student": results[0] });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading student");
    });
});

app.get("/db_test", function(req, res) {
    var sql = 'select * from test_table';
    db.query(sql).then(results => {
        console.log(results);
        res.send(results);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Database error");
    });
});

app.get("/programmes", function(req, res) {
    var sql = 'select * from Programme';
    var output = '<table border="1px">';
    db.query(sql).then(results => {
        for (var row of results) {
            output += '<tr>';
            output += '<td>' + row.programme_id + '</td>';
            output += "<td><a href='/programmes/" + row.programme_id + "'>" + row.programme_name + "</a></td>";
            output += '</tr>';
        }
        output += '</table>';
        res.send(output);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading programmes");
    });
});

app.get("/allstudents", function(req, res) {
    var sql = 'select * from students';
    db.query(sql).then(results => {
        console.log(results);
        res.json(results);
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading all students");
    });
});

app.get("/goodbye", function(req, res) {
    res.send("Goodbye world!");
});

app.get("/roehampton", function(req, res) {
    console.log(req.url);
    let path = req.url;
    res.send(path.substring(0, 4));
});

app.get("/hello/:name", function(req, res) {
    console.log(req.params);
    res.send("Hello " + req.params.name);
});

app.get("/student/:name/:id", function(req, res) {
    let name = req.params.name;
    let id = req.params.id;
    res.send(`
        <table border="1">
            <tr><th>Name</th><th>Id</th></tr>
            <tr><td>${name}</td><td>${id}</td></tr>
        </table>
    `);
});

app.post("/logout", async function(req, res) {
    try {
        const userId = req.body.userId;

        if (!userId) {
            return res.status(400).send("userId is required");
        }

        const updateLastActiveSql = "UPDATE Users SET Last_Active = NOW() WHERE UserID = ?";
        await db.query(updateLastActiveSql, [userId]);

        // In a real app, destroy session here if implemented
        return res.redirect("/");
    } catch (err) {
        console.error(err);
        res.status(500).send("Logout failed");
    }
});

app.get("/logout", async function(req, res) {
    try {
        if (!req.session.user) {
            return res.redirect('/login');
        }

        const userId = req.session.user.id;

        // Mark user as logged out by updating last active timestamp
        const updateLastActiveSql = "UPDATE Users SET Last_Active = NOW() WHERE UserID = ?";
        await db.query(updateLastActiveSql, [userId]);

        // Destroy session and redirect to home
        req.session.destroy(err => {
            if (err) {
                console.error('Session destroy error', err);
            }
            res.redirect('/');
        });
    } catch (err) {
        console.error(err);
        res.status(500).send("Logout failed");
    }
});

app.get("/db_test/:id", function(req, res) {
    const requestedId = req.params.id;
    const sql = "SELECT name FROM test_table WHERE id = ?";

    db.query(sql, [requestedId]).then(result => {
        if (result.length > 0) {
            const userName = result[0].name;
            res.send(`
                <div style="font-family:Arial; border:2px solid #333; padding:20px; border-radius:10px; width:300px;">
                    <h2 style="color:#007bff;">User found!</h2>
                    <p><strong>ID:</strong> ${requestedId}</p>
                    <p><strong>Name:</strong> ${userName}</p>
                </div>
            `);
        } else {
            res.send(`<h1>User not found with Id: ${requestedId}</h1>`);
        }
    }).catch(err => {
        console.error(err);
        res.status(500).send("Database error");
    });
});
// GET /complete-profile
app.get("/complete-profile", async function(req, res) {
    if (!req.session.user) return res.redirect("/login");
    const languages = await db.query("SELECT LanguageID, Language_Name FROM Languages");
    res.render("complete-profile", { title: "Complete Profile", languages, error: null });
});

// POST /complete-profile
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
// SEARCH ROUTE
// URL: /search
// PUG: search.pug
// ==============================
app.get("/search", async function(req, res) {
    const language = (req.query.language || "").trim();
    try {
        const users = language ? await User.searchByLanguage(language) : [];
        console.log("SEARCH QUERY:", language);
        console.log("SEARCH RESULTS:", users);
        res.render("search", { title: "Search Results", users, query: language });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading search results");
    }
});

// Start server on port 3000
app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000`);
});




















































// doctype html
// html
//   head
//     meta(charset="UTF-8")
//     meta(name="viewport", content="width=device-width, initial-scale=1.0")
//     title= title
//     style.
//       body {
//         font-family: Arial, sans-serif;
//         margin: 0;
//         padding: 0;
//         background: #f4f4f4;
//       }
//       header {
//         background: #222;
//         color: white;
//         padding: 15px 20px;
//       }
//       nav {
//         margin-top: 10px;
//       }
//       nav a {
//         color: white;
//         text-decoration: none;
//         margin-right: 15px;
//       }
//       main {
//         padding: 20px;
//       }
//       table {
//         width: 100%;
//         border-collapse: collapse;
//         background: white;
//       }
//       th, td {
//         border: 1px solid #ccc;
//         padding: 10px;
//         text-align: left;
//       }
//       th {
//         background: #eee;
//       }
//   body
//     header
//       h1 Language Exchange Platform
//       nav
//         a(href="/") Home
//         a(href="/users") Users
//         a(href="/languages") Languages
//         a(href="/user-languages") User Languages
//         a(href="/sessions") Sessions
//         a(href="/reviews") Reviews
//         a(href="/reports") Reports
//     main
//       block content