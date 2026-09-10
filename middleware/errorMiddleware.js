/**
 * Centralized Error Handling Middleware
 */

// 404 Handler for undefined routes
exports.notFound = (req, res, next) => {
  res.status(404).render('error/404', {
    title: '404 - Page Not Found',
    page: '404',
    url: req.originalUrl
  });
};

// Global 500 Error Handler
exports.errorHandler = (err, req, res, next) => {
  console.error('[Application Error]:', err);
  const statusCode = res.statusCode === 200 ? 500 : res.statusCode;
  
  res.status(statusCode).render('error/500', {
    title: '500 - Server Error',
    page: '500',
    error: process.env.NODE_ENV === 'development' ? err : {}
  });
};
