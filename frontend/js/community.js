import "./common.js";

import { getFirebaseErrorMessage, getFirebaseSdk, getFirebaseServices } from "./firebase.js";
import { $, clearElement, createElement, normalizeDestination, onReady, renderPlanCard, showMessage } from "./ui.js";

const PAGE_SIZE = 6;
let loadedPlans = [];
let lastVisible = null;
let hasMore = true;

function renderLoadedPlans() {
  const list = $("#community-list");
  const searchTerm = normalizeDestination($("#destination-search")?.value || "");
  clearElement(list);
  const filtered = loadedPlans.filter(({ plan }) => {
    if (!searchTerm) return true;
    return normalizeDestination(plan.destinationNormalized || plan.destination).includes(searchTerm);
  });
  if (!filtered.length) {
    list.append(createElement("div", { className: "empty-state" }, [
      createElement("h2", { text: searchTerm ? "검색 결과가 없습니다." : "공개 일정이 없습니다." }),
      createElement("p", { text: searchTerm ? "다른 여행지로 검색해 보세요." : "첫 공개 일정을 저장해 커뮤니티를 채워 주세요." }),
    ]));
    return;
  }
  filtered.forEach(({ id, plan }) => list.append(renderPlanCard(plan, id)));
}

async function loadMorePlans() {
  const status = $("#community-status");
  const moreButton = $("#load-more-button");
  if (!hasMore) return;
  moreButton.disabled = true;
  showMessage(status, "공개 일정을 불러오는 중입니다.", "info");
  try {
    const { db } = await getFirebaseServices();
    const { collection, getDocs, limit, orderBy, query, startAfter, where } = await getFirebaseSdk();
    const constraints = [
      where("isPublic", "==", true),
      orderBy("createdAt", "desc"),
      limit(PAGE_SIZE),
    ];
    if (lastVisible) constraints.splice(2, 0, startAfter(lastVisible));
    const snapshot = await getDocs(query(collection(db, "itineraries"), ...constraints));
    snapshot.forEach((docSnap) => {
      loadedPlans.push({ id: docSnap.id, plan: docSnap.data() });
    });
    lastVisible = snapshot.docs[snapshot.docs.length - 1] || lastVisible;
    hasMore = snapshot.size === PAGE_SIZE;
    moreButton.hidden = !hasMore;
    renderLoadedPlans();
    showMessage(status, "", "info");
  } catch (error) {
    showMessage(status, getFirebaseErrorMessage(error), "error");
  } finally {
    moreButton.disabled = false;
  }
}

onReady(() => {
  $("#destination-search")?.addEventListener("input", renderLoadedPlans);
  $("#load-more-button")?.addEventListener("click", loadMorePlans);
  loadMorePlans();
});
