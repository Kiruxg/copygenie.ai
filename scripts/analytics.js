document.addEventListener("DOMContentLoaded", function () {
  const timeRange = document.getElementById("timeRange");

  // Initialize charts
  const charts = initializeCharts();

  // Load initial data
  loadAnalyticsData(timeRange.value);

  // Update charts when time range changes
  timeRange.addEventListener("change", () => {
    loadAnalyticsData(timeRange.value);
  });
});

function initializeCharts() {
  // Generations Chart
  const generationsCtx = document
    .getElementById("generationsChart")
    .getContext("2d");
  const generationsChart = new Chart(generationsCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Descriptions Generated",
          data: [],
          borderColor: "#3498db",
          tension: 0.4,
        },
      ],
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
    },
  });

  // Categories Chart
  const categoriesCtx = document
    .getElementById("categoriesChart")
    .getContext("2d");
  const categoriesChart = new Chart(categoriesCtx, {
    type: "doughnut",
    data: {
      labels: [],
      datasets: [
        {
          data: [],
          backgroundColor: ["#3498db", "#2ecc71", "#f1c40f", "#e74c3c"],
        },
      ],
    },
  });

  // Credits Chart
  const creditsCtx = document.getElementById("creditsChart").getContext("2d");
  const creditsChart = new Chart(creditsCtx, {
    type: "bar",
    data: {
      labels: [],
      datasets: [
        {
          label: "Credits Used",
          data: [],
          backgroundColor: "#3498db",
        },
      ],
    },
  });

  // Success Rate Chart
  const successRateCtx = document
    .getElementById("successRateChart")
    .getContext("2d");
  const successRateChart = new Chart(successRateCtx, {
    type: "line",
    data: {
      labels: [],
      datasets: [
        {
          label: "Success Rate",
          data: [],
          borderColor: "#2ecc71",
          tension: 0.4,
        },
      ],
    },
  });

  return {
    generations: generationsChart,
    categories: categoriesChart,
    credits: creditsChart,
    successRate: successRateChart,
  };
}

async function loadAnalyticsData(days) {
  try {
    const response = await fetch(`/api/analytics?days=${days}`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await response.json();
    updateCharts(data);
    updateActivityLog(data.recentActivity);
  } catch (error) {
    console.error("Failed to load analytics:", error);
  }
}

function updateCharts(data) {
  // Update each chart with new data
  charts.generations.data.labels = data.dates;
  charts.generations.data.datasets[0].data = data.generations;
  charts.generations.update();

  charts.categories.data.labels = data.categoryLabels;
  charts.categories.data.datasets[0].data = data.categoryData;
  charts.categories.update();

  charts.credits.data.labels = data.dates;
  charts.credits.data.datasets[0].data = data.creditsUsed;
  charts.credits.update();

  charts.successRate.data.labels = data.dates;
  charts.successRate.data.datasets[0].data = data.successRates;
  charts.successRate.update();
}

function updateActivityLog(activities) {
  const activityLog = document.getElementById("activityLog");
  activityLog.innerHTML = activities
    .map(
      (activity) => `
        <tr>
            <td>${new Date(activity.date).toLocaleDateString()}</td>
            <td>${activity.action}</td>
            <td>${activity.project}</td>
            <td><span class="status-${activity.status.toLowerCase()}">${
        activity.status
      }</span></td>
        </tr>
    `
    )
    .join("");
}
