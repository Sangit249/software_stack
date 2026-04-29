const express = require('express');
const router = express.Router();
const sessionController = require('../controllers/sessionController');

router.get('/sessions/request/:teacherId', sessionController.getRequestForm);
router.post('/sessions/request', sessionController.postRequest);
router.get('/sessions/my', sessionController.getMySessions);
router.post('/sessions/:id/accept', sessionController.postAccept);
router.post('/sessions/:id/decline', sessionController.postDecline);
router.post('/sessions/:id/cancel', sessionController.postCancel);

module.exports = router;