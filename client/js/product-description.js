console.log("Script loaded");

const isLoggedIn = document.cookie.includes("sessionId="); // Basic check - adjust based on your auth method

document.addEventListener("DOMContentLoaded", () => {
  console.log("DOM loaded");

  const form = document.getElementById("productForm");
  const previewDashboard = document.getElementById("previewDashboard");
  const API_URL = "http://localhost:3000";
  const productDescription = document.getElementById("productDescription");

  if (!form) {
    console.error("Product form not found!");
    return;
  }

  let generationCount = 0; // Track generations for anonymous users
  const MAX_FREE_GENERATIONS = 1;

  // Add usage counter to the form
  if (form) {
    // Add usage counter if it doesn't exist
    if (!document.getElementById("usageCounter")) {
      const usageCounter = document.createElement("div");
      usageCounter.id = "usageCounter";
      usageCounter.className = "usage-counter";
      // Insert before the submit button
      form
        .querySelector('button[type="submit"]')
        .parentNode.insertBefore(
          usageCounter,
          form.querySelector('button[type="submit"]')
        );
    }
  }

  // Add premium preview section with better styling
  const premiumPreview = document.createElement("div");
  premiumPreview.style.cssText = `
      padding: 2rem;
      background: white;
      border-radius: 12px;
      text-align: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
      border: 1px solid #e5e7eb;
      display: flex;
      flex-direction: column;
      justify-content: center;
  `;
  premiumPreview.innerHTML = `
      <h3 style="
          color: #1e293b;
          font-size: 1.5rem;
          margin: 0 0 1rem 0;
      ">Want More Features?</h3>
      <p style="
          color: #64748b;
          margin-bottom: 1.5rem;
          font-size: 1.1rem;
      ">Get unlimited generations, SEO optimization, and more!</p>
      <a href="#" style="
          display: inline-block;
          background: #2563eb;
          color: white;
          padding: 0.75rem 2rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 500;
          transition: background-color 0.2s;
      " onmouseover="this.style.background='#1d4ed8'"
        onmouseout="this.style.background='#2563eb'"
      >Upgrade Now</a>
  `;
  document.querySelector("main").appendChild(premiumPreview);

  // Add save work modal
  const saveWorkModal = document.createElement("div");
  saveWorkModal.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 2rem;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      max-width: 400px;
      width: 90%;
      display: none;
  `;
  saveWorkModal.innerHTML = `
      <h3>Save your work</h3>
      <p>Sign up to save and access your generations anytime!</p>
  `;
  document.body.appendChild(saveWorkModal);

  form.addEventListener("submit", async (e) => {
    console.log("Form submitted");
    e.preventDefault();
    e.stopPropagation();

    // Check if user has exceeded free generations
    if (!isLoggedIn && generationCount >= MAX_FREE_GENERATIONS) {
      showSignupModal({
        title: "Ready to Create More?",
        message:
          "Create a free account to get 5 more generations and save your work!",
        features: [
          "5 free generations",
          "Save generation history",
          "Access to basic copywriting styles",
          "Basic export options",
        ],
      });
      return;
    }

    const loadingSpinner = document.querySelector(".loading-spinner");
    const buttonText = document.querySelector(".button-text");
    const submitButton = form.querySelector('button[type="submit"]');

    try {
      loadingSpinner.classList.remove("hidden");
      buttonText.textContent = "Generating...";
      submitButton.disabled = true;

      const formData = {
        productName: form.productName.value,
        personality: form.personality.value,
      };

      console.log("Sending request with data:", formData);

      const response = await fetch(`${API_URL}/api/generate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      console.log("Received response:", data);

      if (data.success) {
        productDescription.textContent = data.description;
        previewDashboard.classList.remove("hidden");

        // Increment generation count for anonymous users
        if (!isLoggedIn) {
          generationCount++;
          if (generationCount === MAX_FREE_GENERATIONS) {
            showSaveWorkModal();
          }
        }

        // Show premium feature previews
        showPremiumFeaturePreviews(data.data);

        Toastify({
          text: "Description generated successfully!",
          duration: 3000,
          gravity: "bottom",
          position: "right",
          style: {
            background: "linear-gradient(to right, #00b09b, #96c93d)",
          },
        }).showToast();

        // Show save work modal after first generation
        if (!localStorage.getItem("hasGenerated")) {
          localStorage.setItem("hasGenerated", "true");
          saveWorkModal.style.display = "block";
        }
      } else {
        throw new Error(data.error || "Failed to generate description");
      }
    } catch (error) {
      console.error("Generation error:", error);
      Toastify({
        text: error.message,
        duration: 3000,
        gravity: "bottom",
        position: "right",
        style: {
          background: "linear-gradient(to right, #ff5f6d, #ffc371)",
        },
      }).showToast();
      previewDashboard.classList.add("hidden");
    } finally {
      loadingSpinner.classList.add("hidden");
      buttonText.textContent = "Generate Description";
      submitButton.disabled = false;
    }
  });

  function updatePreviewDashboard(data) {
    previewDashboard.classList.remove("hidden");

    document.getElementById("seoTitle").textContent = data.seoTitle;
    document.getElementById(
      "seoTitleLength"
    ).textContent = `${data.seoTitle.length}/60`;

    document.getElementById("metaDescription").textContent =
      data.metaDescription;
    document.getElementById(
      "metaDescLength"
    ).textContent = `${data.metaDescription.length}/155`;

    const featuresList = document.getElementById("generatedFeatures");
    featuresList.innerHTML = data.features
      .map((feature) => `<li>${feature}</li>`)
      .join("");

    document.getElementById("productDescription").textContent =
      data.productDescription;

    const keywordsList = document.getElementById("keywords");
    keywordsList.innerHTML = data.keywords
      .map((keyword) => `<li class="keyword-tag">${keyword}</li>`)
      .join("");
  }

  function showSaveWorkModal() {
    const modal = document.createElement("div");
    modal.className = "save-work-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <h3>🎉 Great First Description!</h3>
        <p>Create a free account to:</p>
        <ul>
          <li>✓ Save this description</li>
          <li>✓ Get 5 more generations</li>
          <li>✓ Access basic copywriting styles</li>
          <li>✓ Export your work</li>
        </ul>
        <div class="modal-buttons">
          <button class="btn btn-primary">Sign Up Free</button>
          <button class="btn btn-text">Maybe Later</button>
        </div>
        <div class="social-signup">
          <button class="btn btn-google">
            <img src="/assets/google-icon.svg" alt="Google">
            Continue with Google
          </button>
        </div>
      </div>
    `;
    document.body.appendChild(modal);

    // Add event listeners for buttons
    modal.querySelector(".btn-primary").addEventListener("click", () => {
      window.location.href = "/signup";
    });

    modal.querySelector(".btn-text").addEventListener("click", () => {
      modal.remove();
    });
  }

  function showPremiumFeaturePreviews(data) {
    const previewSection = document.createElement("div");
    previewSection.className = "premium-previews";
    previewSection.innerHTML = `
      <div class="premium-feature locked">
        <div class="feature-header">
          <h4>Advanced Copywriting Styles</h4>
          <span class="pro-badge">PRO</span>
        </div>
        <div class="feature-preview">
          <p>Preview how your description would look in:</p>
          <ul class="style-list">
            <li>✨ Steve Jobs (Tech Visionary)</li>
            <li>🎯 Gary Halbert (Direct Response)</li>
            <li>🎭 David Ogilvy (Classic Ad)</li>
          </ul>
          <button class="btn btn-outline-primary btn-sm">Unlock All Styles</button>
        </div>
      </div>

      <div class="premium-feature locked">
        <div class="feature-header">
          <h4>SEO Optimization</h4>
          <span class="pro-badge">PRO</span>
        </div>
        <div class="feature-preview">
          <p>Enhanced SEO features available:</p>
          <ul class="seo-preview">
            <li>🎯 Keyword density analysis</li>
            <li>📈 Competition insights</li>
            <li>🔍 Search volume data</li>
          </ul>
          <button class="btn btn-outline-primary btn-sm">Upgrade for SEO Tools</button>
        </div>
      </div>
    `;

    // Insert after the preview dashboard
    const previewDashboard = document.getElementById("previewDashboard");
    previewDashboard.parentNode.insertBefore(
      previewSection,
      previewDashboard.nextSibling
    );
  }

  function showSignupModal({ title, message, features }) {
    const modal = document.createElement("div");
    modal.className = "signup-modal";
    modal.innerHTML = `
      <div class="modal-content">
        <div class="modal-header">
          <h3>${title}</h3>
          <p class="modal-subtitle">${message}</p>
        </div>
        
        <div class="generated-preview">
          <div class="preview-label">Your Generated Content</div>
          <div class="preview-content">
            ${document
              .getElementById("productDescription")
              .textContent.slice(0, 150)}...
          </div>
        </div>

        <div class="feature-list">
          ${features
            .map(
              (feature) => `
            <div class="feature-item">
              <span class="feature-icon">✓</span>
              <span>${feature}</span>
            </div>
          `
            )
            .join("")}
        </div>

        <form id="quickSignupForm" class="quick-signup-form">
          <div class="form-group">
            <input type="email" id="signupEmail" placeholder="Enter your email" required>
            <button type="submit" class="btn btn-primary btn-full">
              <span class="button-text">Create Free Account</span>
              <span class="loading-spinner hidden"></span>
            </button>
          </div>
          <div class="form-divider">
            <span>or</span>
          </div>
          <button type="button" class="btn btn-google">
            <img src="/assets/google-icon.svg" alt="Google" />
            Continue with Google
          </button>
        </form>

        <div class="modal-footer">
          <p class="privacy-note">No credit card required • Cancel anytime</p>
          <button class="btn btn-skip">Continue as Guest</button>
        </div>
      </div>
    `;

    document.body.appendChild(modal);

    // Handle quick signup form submission
    const quickSignupForm = modal.querySelector("#quickSignupForm");
    quickSignupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = modal.querySelector("#signupEmail").value;
      const submitBtn = quickSignupForm.querySelector('button[type="submit"]');
      const buttonText = submitBtn.querySelector(".button-text");
      const spinner = submitBtn.querySelector(".loading-spinner");

      try {
        // Show loading state
        submitBtn.disabled = true;
        buttonText.textContent = "Creating Account...";
        spinner.classList.remove("hidden");

        const response = await fetch(`${API_URL}/api/auth/quick-signup`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ email }),
        });

        if (!response.ok) {
          throw new Error("Signup failed");
        }

        const data = await response.json();

        // Show success message and redirect
        buttonText.textContent = "Success! Redirecting...";

        // Save the current generation
        localStorage.setItem(
          "lastGeneration",
          document.getElementById("productDescription").textContent
        );

        // Redirect to onboarding or dashboard
        setTimeout(() => {
          window.location.href = "/onboarding";
        }, 1500);
      } catch (error) {
        console.error("Signup error:", error);
        buttonText.textContent = "Create Free Account";
        submitBtn.disabled = false;

        Toastify({
          text: "Couldn't create account. Please try again.",
          duration: 3000,
          gravity: "top",
          position: "center",
          style: {
            background: "linear-gradient(to right, #ff5f6d, #ffc371)",
          },
        }).showToast();
      } finally {
        spinner.classList.add("hidden");
      }
    });

    // Existing event listeners
    modal.querySelector(".btn-google").addEventListener("click", () => {
      window.location.href = "/auth/google";
    });

    modal.querySelector(".btn-skip").addEventListener("click", () => {
      modal.remove();
    });
  }

  // Modified trial status check
  async function checkTrialStatus() {
    const trialBanner = document.getElementById("trialBanner");
    if (!isLoggedIn) {
      // For non-logged in users, don't show trial banner
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/trial-status`);
      if (!response.ok) {
        console.warn("Trial status endpoint not available");
        return;
      }

      const data = await response.json();
      if (data.daysRemaining <= 2) {
        trialBanner.innerHTML = `
          <div class="alert alert-warning">
            ${
              data.daysRemaining > 0
                ? `${data.daysRemaining} days left in your trial. <a href="/pricing">Upgrade now</a>`
                : 'Trial ended. <a href="/pricing">Subscribe to continue</a>'
            }
          </div>
        `;
        trialBanner.classList.remove("hidden");
      }
    } catch (error) {
      console.warn("Error checking trial status:", error);
    }
  }

  // Modified usage display
  async function updateUsageDisplay() {
    const usageCounter = document.getElementById("usageCounter");
    if (!usageCounter) return; // Guard clause if element doesn't exist

    if (!isLoggedIn) {
      usageCounter.innerHTML = `
        <div class="usage-stats">
          <span class="remaining">${
            MAX_FREE_GENERATIONS - generationCount
          }</span> / 
          <span class="total">${MAX_FREE_GENERATIONS}</span> free generations
        </div>
      `;
      return;
    }

    try {
      const response = await fetch(`${API_URL}/api/usage-status`);
      if (!response.ok) {
        console.warn("Usage status endpoint not available");
        return;
      }

      const data = await response.json();
      usageCounter.innerHTML = `
        <div class="usage-stats">
          <span class="remaining">${data.remainingTokens}</span> / 
          <span class="total">100</span> generations this month
        </div>
      `;
    } catch (error) {
      console.warn("Error updating usage display:", error);
    }
  }

  // Initialize usage display
  updateUsageDisplay();

  // Only check trial status for logged-in users
  if (isLoggedIn) {
    checkTrialStatus();
  }

  // Copy to clipboard functionality
  window.copyToClipboard = () => {
    const text = productDescription.textContent;
    navigator.clipboard
      .writeText(text)
      .then(() => alert("Copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  };

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === saveWorkModal) {
      saveWorkModal.style.display = "none";
    }
  });
});
