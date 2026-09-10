const express = require('express');
const router = express.Router();
const { isAuthenticated } = require('../middleware/auth');

// Generic /dashboard entrypoint redirecting based on role
router.get('/dashboard', isAuthenticated, (req, res) => {
  const role = req.session.user.role;
  if (role === 'customer') return res.redirect('/customer/dashboard');
  if (role === 'driver') return res.redirect('/driver/dashboard');
  if (role === 'admin') return res.redirect('/admin/dashboard');
  return res.redirect('/');
});

module.exports = router;
