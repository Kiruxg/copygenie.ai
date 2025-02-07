document.addEventListener("DOMContentLoaded", function () {
  // Fetch and insert navigation
  fetch("/components/nav.html")
    .then((response) => response.text())
    .then((data) => {
      document.body.insertAdjacentHTML("afterbegin", data);
    })
    .catch((error) => console.error("Error loading navigation:", error));
});
