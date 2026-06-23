import "./common.js";

import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import { $, clearElement, createElement, onReady, renderPlanCard, showMessage } from "./ui.js";

async function loadLatestPlans() {
  const list = $("#latest-plans");
  const message = $("#latest-message");
  if (!list) return;
  clearElement(list);
  list.append(createElement("p", { className: "loading-text", text: "공개 일정을 불러오는 중입니다." }));
  try {
    const { db } = await getFirebaseServices();
    const { collection, getDocs, limit, orderBy, query, where } = await getFirebaseSdk();
    const plansQuery = query(
      collection(db, "itineraries"),
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(3),
    );
    const snapshot = await getDocs(plansQuery);
    clearElement(list);
    if (snapshot.empty) {
      list.append(createElement("p", { className: "empty-text", text: "아직 공개된 일정이 없습니다." }));
      return;
    }
    snapshot.forEach((docSnap) => {
      list.append(renderPlanCard(docSnap.data(), docSnap.id));
    });
  } catch (error) {
    clearElement(list);
    showMessage(message, getFirebaseErrorMessage(error), "warning");
  }
}

onReady(loadLatestPlans);
