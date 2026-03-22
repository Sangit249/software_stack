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

// Get the functions in the db.js file to use
const db = require('./services/db');



// HOME ROUTE

app.get("/", function(req, res) {
    res.render("home", { title: "Home" });
});


// ==============================
// USERS ROUTE
// URL: /users
// PUG: users.pug
// ==============================
app.get("/users", function(req, res) {
    var sql = `
        SELECT UserID, Full_Name, Email, Role, Bio, Average_Rating
        FROM Users
    `;

    db.query(sql).then(results => {
        res.render("users", {
            title: "Users",
            users: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading users");
    });
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
app.get("/reviews", function(req, res) {
    var sql = `
        SELECT ReviewID, SessionID, Star_Rating, Comment
        FROM Reviews
    `;

    db.query(sql).then(results => {
        res.render("reviews", {
            title: "Reviews",
            reviews: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading reviews");
    });
});


// ==============================
// REPORTS ROUTE
// URL: /reports
// PUG: reports.pug
// ==============================
app.get("/reports", function(req, res) {
    var sql = `
        SELECT
            r.ReportID,
            r.ReporterID,
            reporter.Full_Name AS ReporterName,
            r.ReportedUserID,
            reported.Full_Name AS ReportedUserName,
            r.Reason,
            r.Status
        FROM Reports r
        JOIN Users reporter ON r.ReporterID = reporter.UserID
        JOIN Users reported ON r.ReportedUserID = reported.UserID
    `;

    db.query(sql).then(results => {
        res.render("reports", {
            title: "Reports",
            reports: results
        });
    }).catch(err => {
        console.error(err);
        res.status(500).send("Error loading reports");
    });
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
    const userRows = await db.query(
      "SELECT * FROM Users WHERE UserID = ?",
      [userId]
    );

    if (userRows.length === 0) {
      return res.send("User not found");
    }

    const user = userRows[0];

    const languages = await db.query(
      `SELECT 
         l.Language_Name AS languageName,
         ul.Language_Type AS languageType,
         ul.Proficiency_Level AS proficiencyLevel
       FROM User_Languages ul
       JOIN Languages l ON ul.LanguageID = l.LanguageID
       WHERE ul.UserID = ?`,
      [userId]
    );

    const availability = await db.query(
      `SELECT 
         Day_Of_Week AS dayOfWeek,
         Start_Time AS startTime,
         End_Time AS endTime,
         Time_Zone AS timeZone
       FROM User_Availability
       WHERE UserID = ?`,
      [userId]
    );

    const interests = await db.query(
      `SELECT 
         Interest_Name AS interestName
       FROM User_Interests
       WHERE UserID = ?`,
      [userId]
    );

    const preferenceRows = await db.query(
      `SELECT 
         Practice_Method AS practiceMethod,
         Preferred_Session_Type AS preferredSessionType,
         Learning_Goal AS learningGoal
       FROM User_Preferences
       WHERE UserID = ?`,
      [userId]
    );

    const preferences = preferenceRows.length > 0 ? preferenceRows[0] : null;

    console.log("LANGUAGES:", languages);
    console.log("AVAILABILITY:", availability);
    console.log("INTERESTS:", interests);
    console.log("PREFERENCES:", preferences);

    res.render("profile", {
      user,
      languages,
      availability,
      interests,
      preferences
    });

  } catch (error) {
    console.error("PROFILE ROUTE ERROR:", error);
    res.send(error.message);
  }
});

// routes for a   language categories
app.get("/categories", async (req, res) => {
  const rows = await db.query(`
    SELECT c.CategoryID, c.Category_Name, c.Description, l.Language_Name
    FROM Categories c
    LEFT JOIN Languages l ON c.CategoryID = l.CategoryID
    ORDER BY c.CategoryID
  `);

  // Group data
  const categoriesMap = {};

  rows.forEach(row => {
    if (!categoriesMap[row.CategoryID]) {
      categoriesMap[row.CategoryID] = {
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

  res.render("categories", { categories });
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