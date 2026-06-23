import "./common.js";

import { waitForUser } from "./auth.js";
import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import {
  $,
  clearElement,
  createElement,
  formatCurrency,
  onReady,
  renderItinerary,
  showMessage,
} from "./ui.js";

function renderMeta(container, plan, isOwner, id) {
  clearElement(container);
  container.append(
    createElement("h1", { text: plan.title || "여행 일정" }),
    createElement("p", { className: "lead", text: `${plan.destination || "여행지"} · ${plan.startDate || ""} ~ ${plan.endDate || ""}` }),
    createElement("div", { className: "meta-list" }, [
      createElement("span", { text: `작성자 ${plan.authorName || "익명 여행자"}` }),
      createElement("span", { text: `현지 사용 예산 ${formatCurrency(plan.budget || plan.itinerary?.estimatedBudget)}` }),
      createElement("span", { text: `${plan.people || 1}명` }),
      createElement("span", { text: plan.isPublic ? "공개 일정" : "비공개 일정" }),
    ]),
  );
  if (Array.isArray(plan.interests) && plan.interests.length) {
    const tags = createElement("div", { className: "tag-row" });
    plan.interests.forEach((interest) => tags.append(createElement("span", { className: "tag", text: interest })));
    container.append(tags);
  }
  const safeReferrer = document.referrer.startsWith(window.location.origin) && !document.referrer.includes("edit-plan")
    ? document.referrer
    : "community.html";
  const actions = createElement("div", { className: "page-actions" }, [
    createElement("a", { className: "button secondary", text: "목록으로 돌아가기", attrs: { href: safeReferrer } }),
  ]);
  if (isOwner) {
    actions.append(createElement("a", { className: "button primary", text: "수정하기", attrs: { href: `edit-plan.html?id=${encodeURIComponent(id)}` } }));
  }
  container.append(actions);
}

async function loadPlanDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const status = $("#detail-status");
  if (!id) {
    showMessage(status, "일정 ID가 없습니다.", "error");
    return;
  }
  try {
    const user = await waitForUser();
    const { db } = await getFirebaseServices();
    const { doc, getDoc } = await getFirebaseSdk();
    const snapshot = await getDoc(doc(db, "itineraries", id));
    if (!snapshot.exists()) {
      showMessage(status, "일정을 찾을 수 없습니다.", "error");
      return;
    }
    const plan = snapshot.data();
    const isOwner = Boolean(user && plan.userId === user.uid);
    if (!plan.isPublic && !isOwner) {
      showMessage(status, "비공개 일정은 작성자만 볼 수 있습니다.", "error");
      return;
    }
    renderMeta($("#detail-meta"), plan, isOwner, id);
    renderItinerary($("#detail-itinerary"), plan.itinerary);
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

onReady(loadPlanDetail);
