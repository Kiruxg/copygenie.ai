document.addEventListener("DOMContentLoaded", () => {
  const faqItems = document.querySelectorAll(".faq-item");

  faqItems.forEach((item) => {
    const question = item.querySelector(".faq-question");
    const answer = item.querySelector(".faq-answer");

    question.addEventListener("click", () => {
      // Check if this item is already active
      const isActive = item.classList.contains("active");

      // Close all FAQ items
      faqItems.forEach((faqItem) => {
        faqItem.classList.remove("active");
        const otherAnswer = faqItem.querySelector(".faq-answer");
        otherAnswer.style.maxHeight = null;
      });

      // If the clicked item wasn't active, open it
      if (!isActive) {
        item.classList.add("active");
        answer.style.maxHeight = answer.scrollHeight + "px";
      }
    });
  });
});
