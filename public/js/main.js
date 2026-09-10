/**
 * RideGo — Client-Side UI Interactions
 */
document.addEventListener('DOMContentLoaded', () => {

  // 1. Password Visibility Toggle
  const toggleButtons = document.querySelectorAll('.toggle-password');
  toggleButtons.forEach(button => {
    button.addEventListener('click', () => {
      const targetId = button.getAttribute('data-target');
      const input = document.getElementById(targetId);
      const icon = button.querySelector('i');

      if (input) {
        if (input.type === 'password') {
          input.type = 'text';
          icon.classList.remove('fa-eye');
          icon.classList.add('fa-eye-slash');
        } else {
          input.type = 'password';
          icon.classList.remove('fa-eye-slash');
          icon.classList.add('fa-eye');
        }
      }
    });
  });

  // 2. Mobile Dashboard Sidebar Toggle
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const dashboardSidebar = document.getElementById('dashboardSidebar');

  if (openSidebarBtn && dashboardSidebar) {
    openSidebarBtn.addEventListener('click', () => {
      dashboardSidebar.classList.add('show-sidebar');
    });
  }

  if (closeSidebarBtn && dashboardSidebar) {
    closeSidebarBtn.addEventListener('click', () => {
      dashboardSidebar.classList.remove('show-sidebar');
    });
  }

  // 3. Auto-Dismiss Flash Alerts after 5 seconds
  const flashAlerts = document.querySelectorAll('.alert-dismissible');
  flashAlerts.forEach(alert => {
    setTimeout(() => {
      const bsAlert = bootstrap.Alert.getOrCreateInstance(alert);
      if (bsAlert) {
        bsAlert.close();
      }
    }, 5000);
  });

  // 4. Smooth Scrolling for Anchor Links
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      const targetId = this.getAttribute('href');
      if (targetId !== '#' && targetId.length > 1) {
        const targetElement = document.querySelector(targetId);
        if (targetElement) {
          e.preventDefault();
          targetElement.scrollIntoView({
            behavior: 'smooth',
            block: 'start'
          });
        }
      }
    });
  });

});
