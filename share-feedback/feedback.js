document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("feedbackSubmitBtn");
  const statusBox = document.getElementById("feedbackStatus");
  let statusFadeTimeout;
  let statusHideTimeout;
  const successVisibleMs = 5000;
  const fadeDurationMs = 700;

  const submitEndpoint = "https://docs.google.com/forms/d/e/1FAIpQLScI5TOfpN4u2B95iEf5ComAyqCXtc_dfgsKWi-qCtDn6lm5aQ/formResponse";

  form.city.addEventListener("input", () => {
    form.city.setCustomValidity("");
  });

  function showStatus(type, message) {
    clearTimeout(statusFadeTimeout);
    clearTimeout(statusHideTimeout);
    statusBox.classList.remove("fade-out");
    statusBox.style.display = "none";
    statusBox.textContent = "";

    if (!message) return;

    statusBox.className = `feedback-status ${type}`;
    statusBox.textContent = message;
    statusBox.style.display = "block";

    if (type === "success" && message) {
      statusFadeTimeout = setTimeout(() => {
        statusBox.classList.add("fade-out");
      }, Math.max(successVisibleMs - fadeDurationMs, 0));

      statusHideTimeout = setTimeout(() => {
        statusBox.style.display = "none";
        statusBox.classList.remove("fade-out");
        statusBox.textContent = "";
      }, successVisibleMs);
    }
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const cityValue = form.city.value.trim();
    form.city.value = cityValue;

    if (!cityValue) {
      form.city.setCustomValidity("Please enter your city.");
    } else {
      form.city.setCustomValidity("");
    }

    if (!form.checkValidity()) {
      form.reportValidity();
      return;
    }

    const payload = new URLSearchParams({
      "entry.1208653749": form.name.value.trim(),
      "entry.1184556433": form.product.value.trim(),
      "entry.645265237": form.rating.value,
      "entry.983392800": form.review.value.trim(),
      "entry.557158305": cityValue
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
