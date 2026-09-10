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

  // 2. Mobile Dashboard Sidebar Toggle with Overlay Backdrop
  const openSidebarBtn = document.getElementById('openSidebarBtn');
  const closeSidebarBtn = document.getElementById('closeSidebarBtn');
  const dashboardSidebar = document.getElementById('dashboardSidebar');

  // Create or get existing backdrop
  let backdrop = document.querySelector('.sidebar-backdrop');
  if (!backdrop && dashboardSidebar) {
    backdrop = document.createElement('div');
    backdrop.className = 'sidebar-backdrop';
    document.body.appendChild(backdrop);
  }

  function openSidebar() {
    if (dashboardSidebar) {
      dashboardSidebar.classList.add('show-sidebar');
      if (backdrop) backdrop.classList.add('show');
      document.body.classList.add('sidebar-open');
    }
  }

  function closeSidebar() {
    if (dashboardSidebar) {
      dashboardSidebar.classList.remove('show-sidebar');
      if (backdrop) backdrop.classList.remove('show');
      document.body.classList.remove('sidebar-open');
    }
  }

  if (openSidebarBtn) {
    openSidebarBtn.addEventListener('click', openSidebar);
  }

  if (closeSidebarBtn) {
    closeSidebarBtn.addEventListener('click', closeSidebar);
  }

  if (backdrop) {
    backdrop.addEventListener('click', closeSidebar);
  }

  // Close sidebar on ESC key
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && dashboardSidebar && dashboardSidebar.classList.contains('show-sidebar')) {
      closeSidebar();
    }
  });

  // Close sidebar when clicking nav links on mobile
  if (dashboardSidebar) {
    const navLinks = dashboardSidebar.querySelectorAll('.nav-link');
    navLinks.forEach(link => {
      link.addEventListener('click', () => {
        if (window.innerWidth < 992) {
          closeSidebar();
        }
      });
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
