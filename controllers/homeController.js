/**
 * Controller for Home & Public pages
 */
exports.getHomePage = (req, res) => {
  res.render('home', {
    title: 'Your Ride, Your Journey',
    page: 'home'
  });
};
