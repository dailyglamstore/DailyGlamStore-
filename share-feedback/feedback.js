document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("feedbackSubmitBtn");
  const statusBox = document.getElementById("feedbackStatus");

  const submitEndpoint = "https://docs.google.com/forms/d/e/1FAIpQLScI5TOfpN4u2B95iEf5ComAyqCXtc_dfgsKWi-qCtDn6lm5aQ/formResponse";

  function showStatus(type, message) {
    statusBox.className = `feedback-status ${type}`;
    statusBox.textContent = message;
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = new URLSearchParams({
      "entry.1208653749": form.name.value.trim(),
      "entry.1184556433": form.product.value.trim(),
      "entry.645265237": form.rating.value,
      "entry.983392800": form.review.value.trim(),
      "entry.557158305": form.city.value.trim()
    });

    submitBtn.disabled = true;
    showStatus("", "");

    try {
      await fetch(submitEndpoint, {
        method: "POST",
        mode: "no-cors",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8"
        },
        body: payload
      });

      form.reset();
      showStatus("success", "Thank you! Your feedback has been received and will be reviewed soon.");
    } catch (err) {
      console.error("Feedback submission failed:", err);
      showStatus("error", "Sorry, we could not submit your feedback right now. Please try again.");
    } finally {
      submitBtn.disabled = false;
    }
  });
});
