document.addEventListener("DOMContentLoaded", function () {
  const generateForm = document.getElementById("generateForm");
  const resultsSection = document.querySelector(".results-section");
  const resultsContent = document.querySelector(".results-content");
  const regenerateButton = document.querySelector(".regenerate-button");
  const copyButton = document.querySelector(".copy-button");
  const saveButton = document.querySelector(".save-button");

  // Form submission handler
  generateForm.addEventListener("submit", async function (e) {
    e.preventDefault();

    // Show loading state
    const generateButton = generateForm.querySelector(".generate-button");
    generateButton.disabled = true;
    generateButton.textContent = "Generating...";

    try {
      // Collect form data
      const formData = {
        productName: document.getElementById("productName").value,
        category: document.getElementById("productCategory").value,
        features: document.getElementById("keyFeatures").value,
        tone: document.getElementById("tone").value,
        length: document.getElementById("length").value,
      };

      // TODO: Replace with actual API call
      const description = await generateDescription(formData);

      // Display results
      resultsContent.textContent = description;
      resultsSection.style.display = "block";

      // Scroll to results
      resultsSection.scrollIntoView({ behavior: "smooth" });
    } catch (error) {
      console.error("Generation failed:", error);
      alert("Failed to generate description. Please try again.");
    } finally {
      // Reset button state
      generateButton.disabled = false;
      generateButton.textContent = "Generate Description";
    }
  });

  // Regenerate handler
  regenerateButton.addEventListener("click", async function () {
    this.disabled = true;
    this.textContent = "Regenerating...";

    try {
      const formData = {
        productName: document.getElementById("productName").value,
        category: document.getElementById("productCategory").value,
        features: document.getElementById("keyFeatures").value,
        tone: document.getElementById("tone").value,
        length: document.getElementById("length").value,
      };

      const description = await generateDescription(formData);
      resultsContent.textContent = description;
    } catch (error) {
      console.error("Regeneration failed:", error);
      alert("Failed to regenerate description. Please try again.");
    } finally {
      this.disabled = false;
      this.textContent = "Regenerate";
    }
  });

  // Copy to clipboard handler
  copyButton.addEventListener("click", function () {
    navigator.clipboard
      .writeText(resultsContent.textContent)
      .then(() => {
        const originalText = this.textContent;
        this.textContent = "Copied!";
        setTimeout(() => {
          this.textContent = originalText;
        }, 2000);
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy to clipboard");
      });
  });

  // Save to projects handler
  saveButton.addEventListener("click", async function () {
    this.disabled = true;
    this.textContent = "Saving...";

    try {
      await saveToProjects({
        productName: document.getElementById("productName").value,
        description: resultsContent.textContent,
        category: document.getElementById("productCategory").value,
      });

      this.textContent = "Saved!";
      setTimeout(() => {
        this.disabled = false;
        this.textContent = "Save to Projects";
      }, 2000);
    } catch (error) {
      console.error("Save failed:", error);
      alert("Failed to save description");
      this.disabled = false;
      this.textContent = "Save to Projects";
    }
  });

  // Mock API function - replace with actual API call
  async function generateDescription(data) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500));

    // Return mock response
    return `This is a generated description for ${data.productName}. 
                It's written in a ${data.tone} tone and includes the following features: ${data.features}`;
  }

  // Mock save function - replace with actual API call
  async function saveToProjects(data) {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // In real implementation, save to backend
    console.log("Saved project:", data);
  }
});
