import "./common.js";

import { getCurrentIdToken, waitForUser } from "./auth.js";
import { generateItinerary } from "./api.js";
import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import {
  $,
  normalizeDestination,
  readSessionJson,
  renderItinerary,
  onReady,
  setButtonLoading,
  showMessage,
  writeSessionJson,
} from "./ui.js";

let draft = null;
let itinerary = null;

function loadResult() {
  draft = readSessionJson("tripPlanner:draft");
  itinerary = readSessionJson("tripPlanner:result");
  const resultContainer = $("#result-container");
  const emptyState = $("#result-empty");
  if (!draft || !itinerary) {
    resultContainer?.replaceChildren();
    if (emptyState) emptyState.hidden = false;
    return false;
  }
  if (emptyState) emptyState.hidden = true;
  renderItinerary(resultContainer, itinerary);
  return true;
}

async function savePlan() {
  const status = $("#save-status");
  const saveButton = $("#save-button");
  const savedId = sessionStorage.getItem("tripPlanner:savedDocId");
  if (savedId) {
    showMessage(status, "이미 저장된 일정입니다. 내 일정에서 확인해 주세요.", "info");
    return;
  }
  const user = await waitForUser();
  if (!user) {
    window.location.href = `login.html?redirect=${encodeURIComponent("result.html")}`;
    return;
  }

  try {
    setButtonLoading(saveButton, true, "저장 중...");
    const { db } = await getFirebaseServices();
    const { addDoc, collection, serverTimestamp } = await getFirebaseSdk();
    const isPublic = Boolean($("#is-public")?.checked);
    const docRef = await addDoc(collection(db, "itineraries"), {
      userId: user.uid,
      authorName: user.displayName || "익명 여행자",
      title: draft.title,
      destination: draft.destination,
      destinationNormalized: normalizeDestination(draft.destination),
      startDate: draft.startDate,
      endDate: draft.endDate,
      budget: draft.budget,
      people: draft.people,
      interests: draft.interests,
      additionalRequest: draft.additionalRequest || "",
      itinerary,
      isPublic,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    sessionStorage.setItem("tripPlanner:savedDocId", docRef.id);
    showMessage(status, "일정이 저장되었습니다.", "success");
    if ($("#detail-link")) {
      $("#detail-link").href = `plan-detail.html?id=${encodeURIComponent(docRef.id)}`;
      $("#detail-link").hidden = false;
    }
    setButtonLoading(saveButton, false);
    saveButton.disabled = true;
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
    setButtonLoading(saveButton, false);
  }
}

async function regenerate() {
  const status = $("#save-status");
  const button = $("#regenerate-button");
  if (!draft) {
    showMessage(status, "입력 정보가 없어 다시 생성할 수 없습니다. 입력 화면으로 돌아가 주세요.", "error");
    return;
  }
  try {
    setButtonLoading(button, true, "다시 생성 중...");
    showMessage(status, "AI가 새 일정을 만들고 있습니다.", "info");
    const token = await getCurrentIdToken();
    itinerary = await generateItinerary(draft, token);
    writeSessionJson("tripPlanner:result", itinerary);
    sessionStorage.removeItem("tripPlanner:savedDocId");
    renderItinerary($("#result-container"), itinerary);
    $("#save-button").disabled = false;
    $("#detail-link").hidden = true;
    showMessage(status, "새 일정이 생성되었습니다.", "success");
  } catch (error) {
    showMessage(status, error.message || "다시 생성하지 못했습니다.", "error");
  } finally {
    setButtonLoading(button, false);
  }
}

onReady(() => {
  const hasResult = loadResult();
  $("#save-button")?.addEventListener("click", savePlan);
  $("#regenerate-button")?.addEventListener("click", regenerate);
  if (!hasResult) {
    $("#save-button").disabled = true;
    $("#regenerate-button").disabled = true;
  }
  const savedId = sessionStorage.getItem("tripPlanner:savedDocId");
  if (hasResult && savedId && $("#detail-link")) {
    $("#detail-link").href = `plan-detail.html?id=${encodeURIComponent(savedId)}`;
    $("#detail-link").hidden = false;
    $("#save-button").disabled = true;
  }
});
