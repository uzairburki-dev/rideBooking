/**
 * Controller for Dashboard (UI Phase 1)
 */
exports.getDashboardPage = (req, res) => {
  // Demo user data for UI presentation
  const user = {
    name: 'Alex Johnson',
    email: 'alex@example.com',
    role: 'Customer',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80'
  };

  res.render('dashboard/index', {
    title: 'Dashboard Overview',
    page: 'dashboard',
    user
  });
};
