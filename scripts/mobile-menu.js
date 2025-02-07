document.addEventListener("DOMContentLoaded", () => {
  const mobileMenuToggle = document.querySelector(".mobile-menu-toggle");
  const navLinks = document.querySelector(".nav-links");
  const body = document.body;

  // Toggle mobile menu
  mobileMenuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("active");
    body.classList.toggle("mobile-menu-open", isOpen);
    mobileMenuToggle.setAttribute("aria-expanded", isOpen);
  });

  // Close menu when clicking outside
  document.addEventListener("click", (e) => {
    if (
      !e.target.closest(".main-nav") &&
      navLinks.classList.contains("active")
    ) {
      navLinks.classList.remove("active");
      body.classList.remove("mobile-menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", false);
    }
  });

  // Close menu when clicking nav links
  navLinks.addEventListener("click", (e) => {
    if (e.target.tagName === "A") {
      navLinks.classList.remove("active");
      body.classList.remove("mobile-menu-open");
      mobileMenuToggle.setAttribute("aria-expanded", false);
    }
  });

  // Handle window resize
  let resizeTimer;
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      if (window.innerWidth > 768 && navLinks.classList.contains("active")) {
        navLinks.classList.remove("active");
        body.classList.remove("mobile-menu-open");
        mobileMenuToggle.setAttribute("aria-expanded", false);
      }
    }, 250);
  });
});
