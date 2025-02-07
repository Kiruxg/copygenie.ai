document.addEventListener("DOMContentLoaded", function () {
  const projectModal = document.getElementById("projectModal");
  const projectForm = document.getElementById("projectForm");
  const newProjectBtn = document.querySelector(".new-project-btn");
  const cancelBtn = document.querySelector(".cancel-btn");
  const projectsGrid = document.querySelector(".projects-grid");
  const searchInput = document.querySelector(".search-bar input");
  const categoryFilter = document.getElementById("categoryFilter");
  const sortBy = document.getElementById("sortBy");
  const bulkModal = document.getElementById("bulkModal");
  const templateModal = document.getElementById("templateModal");

  let projects = [];
  let currentView = "grid";

  // Project Modal Handlers
  newProjectBtn.addEventListener("click", () => {
    projectModal.style.display = "flex";
    projectForm.reset();
  });

  cancelBtn.addEventListener("click", () => {
    projectModal.style.display = "none";
  });

  // Close modal when clicking outside
  window.addEventListener("click", (e) => {
    if (e.target === projectModal) {
      projectModal.style.display = "none";
    }
  });

  // Form submission handler
  projectForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const projectData = {
      name: document.getElementById("projectName").value,
      category: document.getElementById("projectCategory").value,
      createdAt: new Date().toISOString(),
    };

    try {
      const response = await createProject(projectData);
      addProjectToGrid(response);
      projectModal.style.display = "none";
    } catch (error) {
      console.error("Failed to create project:", error);
      alert("Failed to create project. Please try again.");
    }
  });

  // Delete project handler
  projectsGrid.addEventListener("click", async (e) => {
    if (e.target.classList.contains("delete-btn")) {
      const projectCard = e.target.closest(".project-card");
      const projectId = projectCard.dataset.id;

      if (confirm("Are you sure you want to delete this project?")) {
        try {
          await deleteProject(projectId);
          projectCard.remove();
        } catch (error) {
          console.error("Failed to delete project:", error);
          alert("Failed to delete project. Please try again.");
        }
      }
    }
  });

  // Load initial projects
  loadProjects();

  // Event Listeners
  searchInput.addEventListener("input", filterProjects);
  categoryFilter.addEventListener("change", filterProjects);
  sortBy.addEventListener("change", sortProjects);

  // View Toggle
  document.querySelectorAll(".view-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      currentView = btn.dataset.view;
      document
        .querySelectorAll(".view-btn")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      renderProjects(projects);
    });
  });

  // Bulk Import
  document.querySelector(".import-btn").addEventListener("click", () => {
    bulkModal.style.display = "flex";
  });

  document
    .getElementById("csvUpload")
    .addEventListener("change", handleFileUpload);

  // Template Management
  document
    .querySelector(".save-template-btn")
    .addEventListener("click", saveTemplate);

  async function loadProjects() {
    try {
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      projects = await response.json();
      renderProjects(projects);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  }

  function renderProjects(projectsToRender) {
    projectsGrid.innerHTML = projectsToRender
      .map((project) =>
        currentView === "grid"
          ? renderGridCard(project)
          : renderListItem(project)
      )
      .join("");
  }

  function renderGridCard(project) {
    return `
      <div class="project-card" data-id="${project.id}">
        <div class="project-header">
          <h3>${project.name}</h3>
          <span class="description-count">${
            project.description_count
          } descriptions</span>
        </div>
        <div class="project-meta">
          <span>Category: ${project.category}</span>
          <span>Last updated: ${new Date(
            project.updated_at
          ).toLocaleDateString()}</span>
        </div>
        <div class="project-actions">
          <button class="edit-btn">Edit</button>
          <button class="generate-btn">Generate</button>
          <button class="template-btn">Save as Template</button>
          <button class="delete-btn">Delete</button>
        </div>
      </div>
    `;
  }

  async function handleFileUpload(event) {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const csv = e.target.result;
        const products = parseCSV(csv);
        await bulkGenerate(products);
      };
      reader.readAsText(file);
    }
  }

  async function bulkGenerate(products) {
    const tone = document.getElementById("bulkTone").value;
    const length = document.getElementById("bulkLength").value;

    try {
      for (const product of products) {
        await fetch("/api/generate", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify({
            ...product,
            tone,
            length,
          }),
        });
      }
      bulkModal.style.display = "none";
      loadProjects(); // Refresh projects
    } catch (error) {
      console.error("Bulk generation failed:", error);
    }
  }

  async function saveTemplate() {
    const templateData = {
      name: document.getElementById("templateName").value,
      category: document.getElementById("templateCategory").value,
      description: document.getElementById("templateDescription").value,
    };

    try {
      await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(templateData),
      });
      templateModal.style.display = "none";
    } catch (error) {
      console.error("Failed to save template:", error);
    }
  }

  // Helper functions for filtering and sorting
  function filterProjects() {
    const searchTerm = searchInput.value.toLowerCase();
    const category = categoryFilter.value;

    let filtered = projects.filter((project) => {
      const matchesSearch = project.name.toLowerCase().includes(searchTerm);
      const matchesCategory = !category || project.category === category;
      return matchesSearch && matchesCategory;
    });

    sortProjects(filtered);
  }

  function sortProjects(projectsToSort = projects) {
    const sortValue = sortBy.value;
    const sorted = [...projectsToSort].sort((a, b) => {
      switch (sortValue) {
        case "name":
          return a.name.localeCompare(b.name);
        case "count":
          return b.description_count - a.description_count;
        default:
          return new Date(b.updated_at) - new Date(a.updated_at);
      }
    });
    renderProjects(sorted);
  }
});

// API Functions
async function createProject(projectData) {
  const response = await fetch("/api/projects", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
    body: JSON.stringify(projectData),
  });
  return response.json();
}

async function deleteProject(projectId) {
  await fetch(`/api/projects/${projectId}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });
}

// UI Helper Functions
function addProjectToGrid(project) {
  const template = `
        <div class="project-card" data-id="${project.id}">
            <div class="project-header">
                <h3>${project.name}</h3>
                <span class="description-count">${
                  project.descriptionCount || 0
                } descriptions</span>
            </div>
            <div class="project-meta">
                <span>Last updated: ${new Date(
                  project.updatedAt
                ).toLocaleDateString()}</span>
            </div>
            <div class="project-actions">
                <button class="edit-btn">Edit</button>
                <button class="delete-btn">Delete</button>
            </div>
        </div>
    `;
  projectsGrid.insertAdjacentHTML("beforeend", template);
}
