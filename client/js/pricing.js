document.addEventListener("DOMContentLoaded", () => {
  const toggleBtns = document.querySelectorAll(".toggle-btn");
  const weeklyPlan = document.getElementById("weekly-plan");
  const monthlyPlan = document.getElementById("monthly-plan");
  const annualPlan = document.getElementById("annual-plan");

  toggleBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      // Remove active class from all buttons
      toggleBtns.forEach((b) => b.classList.remove("active"));
      // Add active class to clicked button
      btn.classList.add("active");

      // Show appropriate plan
      weeklyPlan.style.display =
        btn.dataset.plan === "weekly" ? "block" : "none";
      monthlyPlan.style.display =
        btn.dataset.plan === "monthly" ? "block" : "none";
      annualPlan.style.display =
        btn.dataset.plan === "annual" ? "block" : "none";
    });
  });
});
