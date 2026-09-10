/**
 * RideGo — Driver Console Frontend Interactions
 */
document.addEventListener('DOMContentLoaded', () => {

  // Auto-dismiss alerts after 5 seconds
  const driverAlerts = document.querySelectorAll('.alert-dismissible');
  driverAlerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 5000);
  });

  // Handle Form Button Disable on Submit to prevent double clicks
  const driverForms = document.querySelectorAll('form');
  driverForms.forEach(form => {
    form.addEventListener('submit', function () {
      const btn = this.querySelector('button[type="submit"]');
      if (btn && !btn.classList.contains('no-disable')) {
        setTimeout(() => {
          btn.disabled = true;
          btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span> Processing...';
        }, 50);
      }
    });
  });

});
