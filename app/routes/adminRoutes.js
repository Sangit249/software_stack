const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/admin', adminController.getDashboard);
router.get('/admin/users', adminController.getUsers);
router.post('/admin/users/:id/delete', adminController.deleteUser);
router.post('/admin/users/:id/role', adminController.updateUserRole);
router.post('/admin/users/:id/suspend', adminController.suspendUser);
router.post('/admin/users/:id/unsuspend', adminController.unsuspendUser);
router.get('/admin/reports', adminController.getReports);
router.post('/admin/reports/:id/resolve', adminController.resolveReport);
router.post('/admin/reports/:id/dismiss', adminController.dismissReport);
router.get('/admin/languages', adminController.getLanguages);
router.post('/admin/languages/add', adminController.addLanguage);
router.post('/admin/languages/:id/delete', adminController.deleteLanguage);
router.get('/admin/categories', adminController.getCategories);
router.post('/admin/categories/add', adminController.addCategory);
router.post('/admin/categories/:id/delete', adminController.deleteCategory);
router.get('/admin/sessions', adminController.getSessions);

module.exports = router;