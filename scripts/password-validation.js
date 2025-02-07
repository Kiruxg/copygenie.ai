document.addEventListener("DOMContentLoaded", function () {
  const passwordInput = document.getElementById("password");
  const requirements = document.querySelector(".password-requirements");
  let requirementsVisible = false;

  const patterns = {
    length: (password) => password.length >= 8,
    uppercase: (password) => /[A-Z]/.test(password),
    lowercase: (password) => /[a-z]/.test(password),
    number: (password) => /[0-9]/.test(password),
    special: (password) => /[!@#$%^&*]/.test(password),
  };

  function validatePassword(password) {
    let valid = true;

    // Check each requirement
    for (let [requirement, validate] of Object.entries(patterns)) {
      const requirementElement = document.querySelector(
        `[data-requirement="${requirement}"]`
      );
      if (validate(password)) {
        requirementElement.classList.add("valid");
        requirementElement.classList.remove("invalid");
      } else {
        requirementElement.classList.add("invalid");
        requirementElement.classList.remove("valid");
        valid = false;
      }
    }

    return valid;
  }

  // Show requirements only when input is focused and has errors
  passwordInput.addEventListener("focus", function () {
    if (!validatePassword(this.value)) {
      requirements.style.display = "block";
      requirementsVisible = true;
    }
  });

  // Hide requirements when input loses focus
  passwordInput.addEventListener("blur", function () {
    if (validatePassword(this.value)) {
      requirements.style.display = "none";
      requirementsVisible = false;
    }
  });

  // Update requirements in real-time
  passwordInput.addEventListener("input", function () {
    if (requirementsVisible) {
      validatePassword(this.value);

      // Hide requirements if all are valid
      if (validatePassword(this.value)) {
        requirements.style.display = "none";
        requirementsVisible = false;
      }
    }
  });
});
