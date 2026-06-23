import "./common.js";

import { getCurrentIdToken } from "./auth.js";
import { requireAuthenticatedPage } from "./auth-guard.js";
import { generateItinerary } from "./api.js";
import { $, onReady, setButtonLoading, showMessage, writeSessionJson } from "./ui.js";
import { applyFormErrors, getTripFormData, validateTripInput } from "./validators.js";

async function setupPlanner() {
  const user = await requireAuthenticatedPage();
  if (!user) return;

  const form = $("#planner-form");
  const submitButton = $("#generate-button");
  const status = $("#planner-status");
  if (!form || !submitButton) return;

  sessionStorage.removeItem("tripPlanner:result");
  sessionStorage.removeItem("tripPlanner:savedDocId");

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const payload = getTripFormData(form);
    const errors = validateTripInput(payload);
    applyFormErrors(form, errors);
    if (Object.keys(errors).length > 0) {
      showMessage(status, "입력값을 확인해 주세요.", "error");
      return;
    }

    try {
      setButtonLoading(submitButton, true, "AI가 여행 일정을 만들고 있습니다");
      showMessage(status, "AI가 여행 일정을 만들고 있습니다. 잠시만 기다려 주세요.", "info");
      const token = await getCurrentIdToken();
      writeSessionJson("tripPlanner:draft", payload);
      const itinerary = await generateItinerary(payload, token);
      writeSessionJson("tripPlanner:result", itinerary);
      window.location.href = "result.html";
    } catch (error) {
      showMessage(status, error.message || "AI 일정 생성에 실패했습니다. 다시 시도해 주세요.", "error");
      setButtonLoading(submitButton, false);
    }
  });
}

onReady(setupPlanner);
