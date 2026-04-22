const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');

router.get('/reviews', reviewController.getReviews);
router.get('/reviews/submit/:sessionId', reviewController.getReviewForm);
router.post('/reviews/submit', reviewController.postReview);

module.exports = router;