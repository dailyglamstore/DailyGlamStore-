document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("feedbackForm");
  const submitBtn = document.getElementById("feedbackSubmitBtn");
  const statusBox = document.getElementById("feedbackStatus");

  // INSERT GOOGLE APPS SCRIPT SUBMISSION URL HERE
  const submitEndpoint = "https://script.google.com/macros/s/AKfycbwc9J69Q5I2BWbhr5P1j8-zUbob2vjNLJf7PaTDXcoDE2l7qfSMjrcb-8JpCne9CNII/exec";

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

    const payload = {
      name: form.name.value.trim(),
      product: form.product.value.trim(),
      rating: form.rating.value,
      review: form.review.value.trim(),
      city: form.city.value.trim(),
      approved: "",
      timestamp: new Date().toISOString()
    };

    submitBtn.disabled = true;
    showStatus("", "");

    if (!submitEndpoint) {
      submitBtn.disabled = false;
      showStatus("error", "Feedback form is not connected yet. Please try again shortly.");
      return;
    }

    try {
      const res = await fetch(submitEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        throw new Error("Submission failed");
      }

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
