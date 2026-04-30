require('dotenv').config();

const express = require("express");
var app = express();

app.set('view engine', 'pug');
app.set('views', './app/views');

app.use(express.static("static"));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

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
const settingsRoutes = require('./routes/settingsRoutes');
const contentRoutes = require('./routes/contentRoutes');

// ==============================
// HOME ROUTE
// ==============================
app.get("/", function(req, res) {
    res.render("home", { title: "Home" });
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
app.use('/', requireLogin, settingsRoutes);
app.use('/', requireLogin, contentRoutes);
app.use('/', requireAdmin, adminRoutes);


app.listen(3000, function() {
    console.log(`Server running at http://127.0.0.1:3000`);
});