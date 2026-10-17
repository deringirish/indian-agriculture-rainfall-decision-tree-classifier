/**
 * Indian Agriculture Crop Yield Prediction Frontend Logic
 */

function fillPreset(state, crop, year, area, annual, monsoon, prevYield) {
    document.getElementById("state").value = state;
    document.getElementById("crop").value = crop;
    document.getElementById("year").value = year;
    document.getElementById("area").value = area;
    document.getElementById("annual").value = annual;
    document.getElementById("monsoon").value = monsoon;
    document.getElementById("prev_yield").value = prevYield;
}

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("prediction-form");
    const submitBtn = document.getElementById("submit-btn");
    const btnText = submitBtn.querySelector(".btn-text");
    const spinner = submitBtn.querySelector(".spinner");

    const emptyState = document.getElementById("empty-state");
    const resultContent = document.getElementById("result-content");
    const errorMessage = document.getElementById("error-message");

    const outcomeBadge = document.getElementById("outcome-badge");
    const outcomeIcon = document.getElementById("outcome-icon");
    const outcomeTitle = document.getElementById("outcome-title");
    const confidenceVal = document.getElementById("confidence-percentage");
    const progressBarFill = document.getElementById("progress-bar-fill");
    const probFavVal = document.getElementById("prob-fav-val");
    const probUnfavVal = document.getElementById("prob-unfav-val");
    const outcomeSummary = document.getElementById("outcome-summary");

    form.addEventListener("submit", async (e) => {
        e.preventDefault();

        // 1. Set Loading UI State
        btnText.textContent = "Analyzing Patterns...";
        spinner.style.display = "inline-block";
        submitBtn.disabled = true;
        errorMessage.style.display = "none";

        // 2. Gather form data
        const formData = {
            state: document.getElementById("state").value,
            crop: document.getElementById("crop").value,
            year: parseInt(document.getElementById("year").value, 10),
            area: parseFloat(document.getElementById("area").value),
            annual: parseFloat(document.getElementById("annual").value),
            monsoon: parseFloat(document.getElementById("monsoon").value),
            prev_yield: parseFloat(document.getElementById("prev_yield").value),
        };

        try {
            // 3. Send asynchronous POST request to Flask
            const response = await fetch("/predict", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(formData),
            });

            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || "Prediction request failed.");
            }

            // 4. Update Result UI
            emptyState.style.display = "none";
            resultContent.style.display = "block";

            const isFavorable = data.prediction === 1;

            // Reset and apply badge classes
            outcomeBadge.className = "outcome-badge " + (isFavorable ? "favorable" : "unfavorable");
            outcomeIcon.textContent = isFavorable ? "✅" : "⚠️";
            outcomeTitle.textContent = data.label;

            // Update Progress Bar & Values
            confidenceVal.textContent = data.confidence + "%";
            progressBarFill.style.width = data.confidence + "%";
            progressBarFill.className = "progress-bar-fill " + (isFavorable ? "favorable" : "unfavorable");

            probFavVal.textContent = data.prob_favorable + "%";
            probUnfavVal.textContent = data.prob_unfavorable + "%";

            // Update Text Summary
            outcomeSummary.textContent = data.summary;

        } catch (err) {
            console.error(err);
            errorMessage.textContent = "Error: " + err.message;
            errorMessage.style.display = "block";
            resultContent.style.display = "none";
            emptyState.style.display = "block";
        } finally {
            // 5. Restore Button UI
            btnText.textContent = "Predict Yield Outcome";
            spinner.style.display = "none";
            submitBtn.disabled = false;
        }
    });
});
