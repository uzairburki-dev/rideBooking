const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { isAuthenticated, isGuest } = require('../middleware/auth');

// Public Guest Auth Routes
router.get('/login', isGuest, authController.getLoginPage);
router.post('/login', isGuest, authController.postLogin);

router.get('/register', isGuest, authController.getRegisterPage);
router.post('/register', isGuest, authController.postRegister);

router.get('/driver/register', isGuest, authController.getDriverRegisterPage);
router.post('/driver/register', isGuest, authController.postDriverRegister);

// Authenticated Routes
router.post('/logout', isAuthenticated, authController.postLogout);
router.get('/profile', isAuthenticated, authController.getProfile);

module.exports = router;
