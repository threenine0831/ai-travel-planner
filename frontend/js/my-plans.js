import "./common.js";

import { requireAuthenticatedPage } from "./auth-guard.js";
import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import { $, clearElement, createElement, onReady, renderPlanCard, showMessage } from "./ui.js";

let currentUser = null;

async function deletePlan(id, plan) {
  const ok = window.confirm(`'${plan.title || "이 일정"}'을 삭제할까요? 삭제한 일정은 되돌릴 수 없습니다.`);
  if (!ok) return;
  const status = $("#plans-status");
  try {
    const { db } = await getFirebaseServices();
    const { deleteDoc, doc } = await getFirebaseSdk();
    await deleteDoc(doc(db, "itineraries", id));
    showMessage(status, "일정이 삭제되었습니다.", "success");
    await loadPlans();
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

async function loadPlans() {
  const list = $("#my-plan-list");
  const status = $("#plans-status");
  clearElement(list);
  list.append(createElement("p", { className: "loading-text", text: "내 일정을 불러오는 중입니다." }));
  try {
    const { db } = await getFirebaseServices();
    const { collection, getDocs, orderBy, query, where } = await getFirebaseSdk();
    const plansQuery = query(
      collection(db, "itineraries"),
      where("userId", "==", currentUser.uid),
      orderBy("updatedAt", "desc"),
    );
    const snapshot = await getDocs(plansQuery);
    clearElement(list);
    if (snapshot.empty) {
      list.append(createElement("div", { className: "empty-state" }, [
        createElement("h2", { text: "아직 저장한 일정이 없습니다." }),
        createElement("p", { text: "여행 정보를 입력하고 AI가 만든 일정을 저장해 보세요." }),
        createElement("a", { className: "button primary", text: "여행 계획 만들기", attrs: { href: "planner.html" } }),
      ]));
      return;
    }
    snapshot.forEach((docSnap) => {
      list.append(renderPlanCard(docSnap.data(), docSnap.id, {
        showOwnerActions: true,
        onDelete: deletePlan,
      }));
    });
  } catch (error) {
    clearElement(list);
    showMessage(status, getFirebaseErrorMessage(error), "error");
  }
}

onReady(async () => {
  currentUser = await requireAuthenticatedPage();
  if (currentUser) {
    loadPlans();
  }
});
