const { Review } = require('../models/reviewModel');
const { Session } = require('../models/sessionModel');
const db = require('../services/db');

exports.getReviews = async (req, res) => {
    try {
        const reviews = await Review.getAllReviews();
        res.render("reviews", { title: "Reviews", reviews });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading reviews");
    }
};

exports.getReviewForm = async (req, res) => {
    try {
        const session = await Session.getSessionById(req.params.sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(req.session.user.id)) return res.status(403).send("Only the learner can leave a review.");
        if (session.Status !== "Accepted") return res.status(400).send("You can only review accepted sessions.");
        const existing = await db.query("SELECT ReviewID FROM Reviews WHERE SessionID = ?", [req.params.sessionId]);
        if (existing && existing.length > 0) return res.status(400).send("You have already reviewed this session.");
        res.render("review-form", { title: "Leave a Review", session, error: null });
    } catch (err) {
        console.error(err);
        res.status(500).send("Error loading review form.");
    }
};

exports.postReview = async (req, res) => {
    const { sessionId, star_rating, comment } = req.body;
    if (!sessionId || !star_rating) return res.status(400).send("Please fill in all required fields.");
    const rating = parseInt(star_rating);
    if (rating < 1 || rating > 5) return res.status(400).send("Rating must be between 1 and 5.");
    try {
        const session = await Session.getSessionById(sessionId);
        if (!session) return res.status(404).send("Session not found.");
        if (String(session.LearnerID) !== String(req.session.user.id)) return res.status(403).send("Only the learner can leave a review.");
        if (session.Status !== "Accepted") return res.status(400).send("You can only review accepted sessions.");
        const existing = await db.query("SELECT ReviewID FROM Reviews WHERE SessionID = ?", [sessionId]);
        if (existing && existing.length > 0) return res.status(400).send("You have already reviewed this session.");
        await db.query(`INSERT INTO Reviews (SessionID, Star_Rating, Comment) VALUES (?, ?, ?)`, [sessionId, rating, comment || null]);
        return res.redirect("/sessions/my?reviewed=true");
    } catch (err) {
        console.error(err);
        res.status(500).send("Error submitting review.");
    }
};