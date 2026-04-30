const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

router.get('/users', userController.getUsers);
router.get('/users/:id', userController.getProfile);
router.get('/complete-profile', userController.getCompleteProfile);
router.post('/complete-profile', userController.postCompleteProfile);
router.get('/search', userController.getSearch);

module.exports = router;