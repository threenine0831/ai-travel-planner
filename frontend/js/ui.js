export function $(selector, scope = document) {
  return scope.querySelector(selector);
}

export function $all(selector, scope = document) {
  return Array.from(scope.querySelectorAll(selector));
}

export function onReady(callback) {
  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", callback, { once: true });
  } else {
    callback();
  }
}

export function createElement(tag, options = {}, children = []) {
  const element = document.createElement(tag);
  if (options.className) {
    element.className = options.className;
  }
  if (options.text !== undefined) {
    element.textContent = options.text;
  }
  if (options.attrs) {
    Object.entries(options.attrs).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        element.setAttribute(key, String(value));
      }
    });
  }
  children.forEach((child) => {
    if (child !== null && child !== undefined) {
      element.append(child);
    }
  });
  return element;
}

export function clearElement(element) {
  if (element) {
    element.replaceChildren();
  }
}

export function showMessage(element, message, type = "info") {
  if (!element) return;
  element.textContent = message || "";
  element.className = `message ${type}`;
  element.hidden = !message;
}

export function setButtonLoading(button, isLoading, loadingText = "처리 중...") {
  if (!button) return;
  if (isLoading) {
    button.dataset.originalText = button.textContent;
    button.textContent = loadingText;
    button.disabled = true;
    button.classList.add("is-loading");
  } else {
    button.textContent = button.dataset.originalText || button.textContent;
    button.disabled = false;
    button.classList.remove("is-loading");
  }
}

export function formatCurrency(value) {
  const amount = Number(value || 0);
  return `${amount.toLocaleString("ko-KR")}원`;
}

export function formatDate(value) {
  if (!value) return "";
  if (value.toDate) {
    return value.toDate().toLocaleDateString("ko-KR");
  }
  return String(value);
}

export function dayCount(startDate, endDate) {
  const start = new Date(`${startDate}T00:00:00`);
  const end = new Date(`${endDate}T00:00:00`);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return 0;
  return Math.round((end - start) / 86400000) + 1;
}

export function normalizeDestination(destination) {
  return String(destination || "").trim().toLocaleLowerCase("ko-KR");
}

export function readSessionJson(key) {
  try {
    const raw = sessionStorage.getItem(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function writeSessionJson(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function createMetaList(items) {
  const list = createElement("div", { className: "meta-list" });
  items.filter(Boolean).forEach((item) => {
    list.append(createElement("span", { text: item }));
  });
  return list;
}

export function renderItinerary(container, itinerary) {
  clearElement(container);
  if (!itinerary) {
    container.append(createElement("p", { className: "empty-text", text: "표시할 일정이 없습니다." }));
    return;
  }

  const header = createElement("div", { className: "result-head" }, [
    createElement("div", {}, [
      createElement("p", { className: "eyebrow", text: itinerary.destination || "여행지" }),
      createElement("h2", { text: itinerary.title || "AI 여행 일정" }),
      createElement("p", { className: "lead", text: itinerary.summary || "여행 요약이 없습니다." }),
    ]),
    createElement("div", { className: "budget-badge" }, [
      createElement("span", { text: "예상 현지 비용" }),
      createElement("strong", { text: formatCurrency(itinerary.estimatedBudget) }),
    ]),
  ]);
  container.append(header);

  const daysWrap = createElement("div", { className: "days" });
  (itinerary.days || []).forEach((day) => {
    const daySection = createElement("section", { className: "day-card" });
    daySection.append(
      createElement("div", { className: "day-title" }, [
        createElement("span", { className: "day-number", text: `${day.day}일차` }),
        createElement("h3", { text: day.date }),
      ]),
    );

    const timeline = createElement("div", { className: "timeline" });
    (day.items || []).forEach((item) => {
      timeline.append(
        createElement("article", { className: "timeline-item" }, [
          createElement("time", { text: item.time || "시간 미정" }),
          createElement("div", { className: "timeline-body" }, [
            createElement("h4", { text: item.place || "장소 미정" }),
            createElement("p", { text: item.activity || "활동 내용 없음" }),
            createMetaList([
              `예상 비용 ${formatCurrency(item.estimatedCost)}`,
              item.notes ? `참고 ${item.notes}` : "",
            ]),
          ]),
        ]),
      );
    });
    daySection.append(timeline);
    daysWrap.append(daySection);
  });
  container.append(daysWrap);

  const tips = itinerary.tips || [];
  if (tips.length) {
    const tipList = createElement("ul", { className: "tips-list" });
    tips.forEach((tip) => tipList.append(createElement("li", { text: tip })));
    container.append(createElement("section", { className: "tips-card" }, [
      createElement("h3", { text: "여행 팁" }),
      tipList,
    ]));
  }
}

export function renderPlanCard(plan, id, options = {}) {
  const card = createElement("article", { className: "plan-card" });
  const titleLink = createElement("a", {
    className: "card-title-link",
    text: plan.title || "제목 없는 일정",
    attrs: { href: `plan-detail.html?id=${encodeURIComponent(id)}` },
  });
  card.append(
    createElement("div", { className: "plan-card-head" }, [
      createElement("div", {}, [
        titleLink,
        createElement("p", { className: "muted", text: plan.destination || "여행지 미정" }),
      ]),
      createElement("span", {
        className: plan.isPublic ? "status-pill public" : "status-pill private",
        text: plan.isPublic ? "공개" : "비공개",
      }),
    ]),
  );

  card.append(createMetaList([
    `${plan.startDate || ""} ~ ${plan.endDate || ""}`,
    `${dayCount(plan.startDate, plan.endDate)}일`,
    `현지 예산 ${formatCurrency(plan.budget || plan.itinerary?.estimatedBudget)}`,
    plan.authorName ? `작성자 ${plan.authorName}` : "",
    plan.createdAt ? `작성 ${formatDate(plan.createdAt)}` : "",
    plan.updatedAt ? `수정 ${formatDate(plan.updatedAt)}` : "",
  ]));

  if (Array.isArray(plan.interests) && plan.interests.length) {
    const tags = createElement("div", { className: "tag-row" });
    plan.interests.slice(0, 4).forEach((interest) => {
      tags.append(createElement("span", { className: "tag", text: interest }));
    });
    card.append(tags);
  }

  const actions = createElement("div", { className: "card-actions" });
  actions.append(createElement("a", {
    className: "button secondary small",
    text: "상세 보기",
    attrs: { href: `plan-detail.html?id=${encodeURIComponent(id)}` },
  }));
  if (options.showOwnerActions) {
    actions.append(createElement("a", {
      className: "button secondary small",
      text: "수정",
      attrs: { href: `edit-plan.html?id=${encodeURIComponent(id)}` },
    }));
    const deleteButton = createElement("button", {
      className: "button danger small",
      text: "삭제",
      attrs: { type: "button" },
    });
    deleteButton.addEventListener("click", () => options.onDelete?.(id, plan));
    actions.append(deleteButton);
  }
  card.append(actions);
  return card;
}
