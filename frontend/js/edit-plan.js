import "./common.js";

import { requireAuthenticatedPage } from "./auth-guard.js";
import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import { $, clearElement, createElement, onReady, showMessage } from "./ui.js";

let currentUser = null;
let currentPlan = null;
let currentPlanId = null;

function makeInput(labelText, value, className, type = "text") {
  const label = createElement("label", { className: "field compact" });
  label.append(createElement("span", { text: labelText }));
  const input = createElement("input", { attrs: { type, value: value || "" } });
  label.append(input);
  if (className) input.classList.add(className);
  return { label, input };
}

function createItemEditor(item = {}) {
  const itemBox = createElement("div", { className: "item-editor" });
  const time = makeInput("시간", item.time || "", "item-time", "time");
  const place = makeInput("장소", item.place || "", "item-place");
  const activity = makeInput("활동 내용", item.activity || "", "item-activity");
  const cost = makeInput("예상 비용", item.estimatedCost || 0, "item-cost", "number");
  const notes = makeInput("참고사항", item.notes || "", "item-notes");
  const remove = createElement("button", { className: "button danger small", text: "일정 항목 삭제", attrs: { type: "button" } });
  remove.addEventListener("click", () => itemBox.remove());
  itemBox.append(time.label, place.label, activity.label, cost.label, notes.label, remove);
  return itemBox;
}

function createDayEditor(day) {
  const dayBox = createElement("section", { className: "edit-day-card", attrs: { "data-day": day.day, "data-date": day.date } });
  dayBox.append(createElement("h3", { text: `${day.day}일차 · ${day.date}` }));
  const itemsWrap = createElement("div", { className: "item-editor-list" });
  (day.items || []).forEach((item) => itemsWrap.append(createItemEditor(item)));
  const addButton = createElement("button", { className: "button secondary small", text: "일정 항목 추가", attrs: { type: "button" } });
  addButton.addEventListener("click", () => {
    itemsWrap.append(createItemEditor({
      time: "09:00",
      place: "",
      activity: "",
      estimatedCost: 0,
      notes: "",
    }));
  });
  dayBox.append(itemsWrap, addButton);
  return dayBox;
}

function createTipEditor(tip = "") {
  const row = createElement("div", { className: "tip-editor" });
  const input = createElement("input", { attrs: { type: "text", value: tip, "aria-label": "여행 팁" } });
  const remove = createElement("button", { className: "button danger small", text: "팁 삭제", attrs: { type: "button" } });
  remove.addEventListener("click", () => row.remove());
  row.append(input, remove);
  return row;
}

function renderEditor(plan) {
  $("#edit-title").value = plan.title || "";
  $("#edit-summary").value = plan.itinerary?.summary || "";
  $("#edit-is-public").checked = Boolean(plan.isPublic);

  const daysContainer = $("#edit-days");
  clearElement(daysContainer);
  (plan.itinerary?.days || []).forEach((day) => daysContainer.append(createDayEditor(day)));

  const tipsContainer = $("#edit-tips");
  clearElement(tipsContainer);
  (plan.itinerary?.tips || []).forEach((tip) => tipsContainer.append(createTipEditor(tip)));
  if (!plan.itinerary?.tips?.length) tipsContainer.append(createTipEditor(""));
}

function collectEditorData() {
  const days = Array.from(document.querySelectorAll(".edit-day-card")).map((dayBox) => ({
    day: Number(dayBox.dataset.day),
    date: dayBox.dataset.date,
    items: Array.from(dayBox.querySelectorAll(".item-editor")).map((itemBox) => ({
      time: itemBox.querySelector(".item-time").value.trim() || "시간 미정",
      place: itemBox.querySelector(".item-place").value.trim() || "장소 미정",
      activity: itemBox.querySelector(".item-activity").value.trim() || "활동 내용 없음",
      estimatedCost: Number(itemBox.querySelector(".item-cost").value || 0),
      notes: itemBox.querySelector(".item-notes").value.trim(),
    })).filter((item) => item.place || item.activity),
  }));
  const tips = Array.from(document.querySelectorAll(".tip-editor input"))
    .map((input) => input.value.trim())
    .filter(Boolean);
  const title = $("#edit-title").value.trim();
  const summary = $("#edit-summary").value.trim();
  return { title, summary, days, tips, isPublic: $("#edit-is-public").checked };
}

async function saveEdit(event) {
  event.preventDefault();
  const status = $("#edit-status");
  const data = collectEditorData();
  if (!data.title) {
    showMessage(status, "여행 제목을 입력해 주세요.", "error");
    $("#edit-title").focus();
    return;
  }
  if (data.days.some((day) => !day.items.length)) {
    showMessage(status, "각 날짜에는 일정 항목이 최소 1개 이상 필요합니다.", "error");
    return;
  }
  try {
    const { db } = await getFirebaseServices();
    const { doc, serverTimestamp, updateDoc } = await getFirebaseSdk();
    const itinerary = {
      ...currentPlan.itinerary,
      title: data.title,
      summary: data.summary,
      days: data.days,
      tips: data.tips,
    };
    await updateDoc(doc(db, "itineraries", currentPlanId), {
      title: data.title,
      itinerary,
      isPublic: data.isPublic,
      updatedAt: serverTimestamp(),
    });
    showMessage(status, "일정이 저장되었습니다.", "success");
    window.location.href = `plan-detail.html?id=${encodeURIComponent(currentPlanId)}`;
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

async function deleteCurrentPlan() {
  const ok = window.confirm("이 일정을 삭제할까요? 삭제한 일정은 되돌릴 수 없습니다.");
  if (!ok) return;
  const status = $("#edit-status");
  try {
    const { db } = await getFirebaseServices();
    const { deleteDoc, doc } = await getFirebaseSdk();
    await deleteDoc(doc(db, "itineraries", currentPlanId));
    window.location.href = "my-plans.html";
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

async function loadEditablePlan() {
  currentUser = await requireAuthenticatedPage();
  if (!currentUser) return;
  const params = new URLSearchParams(window.location.search);
  currentPlanId = params.get("id");
  const status = $("#edit-status");
  if (!currentPlanId) {
    showMessage(status, "일정 ID가 없습니다.", "error");
    return;
  }
  try {
    const { db } = await getFirebaseServices();
    const { doc, getDoc } = await getFirebaseSdk();
    const snapshot = await getDoc(doc(db, "itineraries", currentPlanId));
    if (!snapshot.exists()) {
      showMessage(status, "일정을 찾을 수 없습니다.", "error");
      return;
    }
    currentPlan = snapshot.data();
    if (currentPlan.userId !== currentUser.uid) {
      showMessage(status, "자신의 일정만 수정할 수 있습니다.", "error");
      return;
    }
    renderEditor(currentPlan);
    $("#edit-form").hidden = false;
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

onReady(() => {
  $("#edit-form")?.addEventListener("submit", saveEdit);
  $("#add-tip-button")?.addEventListener("click", () => $("#edit-tips").append(createTipEditor("")));
  $("#delete-plan-button")?.addEventListener("click", deleteCurrentPlan);
  $("#cancel-edit-button")?.addEventListener("click", () => {
    window.location.href = currentPlanId ? `plan-detail.html?id=${encodeURIComponent(currentPlanId)}` : "my-plans.html";
  });
  loadEditablePlan();
});
