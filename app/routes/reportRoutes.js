const express = require('express');
const router = express.Router();
const reportController = require('../controllers/reportController');

router.get('/reports', reportController.getReports);
router.get('/reports/submit/:userId', reportController.getReportForm);
router.post('/reports/submit', reportController.postReport);

module.exports = router;