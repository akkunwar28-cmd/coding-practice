"use strict";

const form = document.querySelector("#pin-form");
const pinInput = document.querySelector("#pin-input");
const visibilityButton = document.querySelector("#visibility-button");
const errorMessage = document.querySelector("#pin-error");
const result = document.querySelector("#result");
const strengthName = document.querySelector("#strength-name");
const scoreValue = document.querySelector("#score-value");
const meter = document.querySelector("#strength-meter");
const meterFill = document.querySelector("#meter-fill");
const resultSummary = document.querySelector("#result-summary");
const tipsList = document.querySelector("#tips-list");

function getRepeatedPatternLength(pin) {
  for (let size = 1; size <= Math.floor(pin.length / 2); size += 1) {
    if (pin.length % size === 0 && pin === pin.slice(0, size).repeat(pin.length / size)) {
      return size;
    }
  }
  return 0;
}

function isSequential(pin) {
  if (pin.length < 3) return false;
  const steps = [];

  for (let index = 1; index < pin.length; index += 1) {
    steps.push(Number(pin[index]) - Number(pin[index - 1]));
  }

  return steps.every((step) => step === 1) || steps.every((step) => step === -1);
}

function assessPin(pin) {
  const uniqueDigits = new Set(pin).size;
  const repeatedPatternLength = getRepeatedPatternLength(pin);
  const sequential = isSequential(pin);
  let score = Math.min(98, 17 + pin.length * 7 + uniqueDigits * 2);
  const tips = [];

  if (pin.length < 6) {
    score -= 12;
    tips.push("Use at least 6 digits if your device or service allows it.");
  } else {
    tips.push("A longer PIN is generally harder to guess.");
  }

  if (uniqueDigits <= 2) {
    score -= 20;
    tips.push("Avoid using only one or two different digits.");
  } else if (uniqueDigits < pin.length) {
    score -= 8;
    tips.push("Mix more different digits instead of repeating digits.");
  } else {
    tips.push("Using a wider mix of digits helps avoid obvious patterns.");
  }

  if (repeatedPatternLength > 0 && pin.length > repeatedPatternLength) {
    score -= repeatedPatternLength === 1 ? 20 : 14;
    tips.push("Avoid repeated digits or a repeating block.");
  }

  if (sequential) {
    score -= 40;
    tips.push("Avoid a simple counting sequence, in either direction.");
  }

  if (tips.length === 0) {
    tips.push("Avoid personal dates and don't reuse this PIN across accounts.");
  } else if (!tips.some((tip) => tip.includes("personal dates"))) {
    tips.push("Avoid personal dates and don't reuse this PIN across accounts.");
  }

  score = Math.max(0, Math.min(100, score));
  let level = "weak";
  let label = "Weak";
  if (score >= 78) {
    level = "strong";
    label = "Strong";
  } else if (score >= 58) {
    level = "good";
    label = "Good";
  } else if (score >= 38) {
    level = "fair";
    label = "Fair";
  }

  return { score, level, label, tips };
}

function clearResult() {
  result.hidden = true;
  meter.setAttribute("aria-valuenow", "0");
  meterFill.style.width = "0%";
  tipsList.replaceChildren();
}

visibilityButton.addEventListener("click", () => {
  const showing = pinInput.type === "password";
  pinInput.type = showing ? "text" : "password";
  visibilityButton.setAttribute("aria-pressed", String(showing));
  visibilityButton.setAttribute("aria-label", showing ? "Hide PIN" : "Show PIN");
});

pinInput.addEventListener("input", () => {
  errorMessage.textContent = "";
  clearResult();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();
  const pin = pinInput.value;
  if (!/^\d{4,12}$/.test(pin)) {
    errorMessage.textContent = "Enter a PIN with 4 to 12 digits.";
    clearResult();
    pinInput.focus();
    return;
  }

  errorMessage.textContent = "";
  const assessment = assessPin(pin);
  strengthName.textContent = assessment.label;
  scoreValue.textContent = String(assessment.score);
  resultSummary.textContent = `${pin.length} digits checked. This is a relative, pattern-based estimate, not a security guarantee.`;
  tipsList.replaceChildren(...assessment.tips.map((tip) => {
    const item = document.createElement("li");
    item.textContent = tip;
    return item;
  }));
  result.dataset.level = assessment.level;
  meter.setAttribute("aria-valuenow", String(assessment.score));
  meterFill.style.width = `${assessment.score}%`;
  result.hidden = false;
});
