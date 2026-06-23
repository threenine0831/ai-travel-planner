export const INTERESTS = ["맛집", "관광", "자연", "쇼핑", "문화", "휴식", "사진", "액티비티"];

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

function trim(value) {
  return String(value || "").replace(/\s+/g, " ").trim();
}

function isValidDate(value) {
  if (!DATE_PATTERN.test(value)) return false;
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(year, month - 1, day);
  return (
    date.getFullYear() === year
    && date.getMonth() === month - 1
    && date.getDate() === day
  );
}

function getDuration(startDate, endDate) {
  const [startYear, startMonth, startDay] = startDate.split("-").map(Number);
  const [endYear, endMonth, endDay] = endDate.split("-").map(Number);
  const start = Date.UTC(startYear, startMonth - 1, startDay);
  const end = Date.UTC(endYear, endMonth - 1, endDay);
  return Math.round((end - start) / 86400000) + 1;
}

export function getTripFormData(form) {
  const fields = form.elements;
  return {
    title: trim(fields.title.value),
    destination: trim(fields.destination.value),
    startDate: fields.startDate.value,
    endDate: fields.endDate.value,
    budget: Number(fields.budget.value),
    people: Number(fields.people.value),
    interests: Array.from(form.querySelectorAll('input[name="interests"]:checked')).map((input) => input.value),
    additionalRequest: trim(fields.additionalRequest.value),
  };
}

export function validateTripInput(data) {
  const errors = {};
  if (!data.title) errors.title = "여행 제목을 입력해 주세요.";
  if (data.title && data.title.length > 80) errors.title = "여행 제목은 80자 이하로 입력해 주세요.";
  if (!data.destination) errors.destination = "여행지를 입력해 주세요.";
  if (data.destination && data.destination.length > 80) errors.destination = "여행지는 80자 이하로 입력해 주세요.";
  if (!data.startDate) errors.startDate = "시작일을 선택해 주세요.";
  if (data.startDate && !isValidDate(data.startDate)) errors.startDate = "시작일 형식이 올바르지 않습니다.";
  if (!data.endDate) errors.endDate = "종료일을 선택해 주세요.";
  if (data.endDate && !isValidDate(data.endDate)) errors.endDate = "종료일 형식이 올바르지 않습니다.";

  if (isValidDate(data.startDate) && isValidDate(data.endDate)) {
    const duration = getDuration(data.startDate, data.endDate);
    if (duration < 1) errors.endDate = "종료일은 시작일보다 빠를 수 없습니다.";
    if (duration > 14) errors.endDate = "여행 기간은 최대 14일까지 가능합니다.";
  }

  if (!Number.isFinite(data.budget) || data.budget <= 0) {
    errors.budget = "현지 사용 예산은 0보다 큰 숫자로 입력해 주세요.";
  }
  if (!Number.isInteger(data.people) || data.people < 1 || data.people > 20) {
    errors.people = "여행 인원은 1명 이상 20명 이하로 입력해 주세요.";
  }
  if (!Array.isArray(data.interests) || data.interests.length < 1) {
    errors.interests = "관심사를 1개 이상 선택해 주세요.";
  }
  if (data.additionalRequest.length > 500) {
    errors.additionalRequest = "추가 요청사항은 500자 이하로 입력해 주세요.";
  }
  return errors;
}

export function applyFormErrors(form, errors) {
  form.querySelectorAll("[data-error-for]").forEach((element) => {
    element.textContent = "";
  });
  Object.entries(errors).forEach(([field, message]) => {
    const errorElement = form.querySelector(`[data-error-for="${field}"]`);
    if (errorElement) errorElement.textContent = message;
  });
  const firstField = Object.keys(errors)[0];
  if (firstField) {
    const input = form.querySelector(`[name="${firstField}"]`) || form.querySelector(`[data-field="${firstField}"]`);
    const focusTarget = input?.matches?.("[data-field]") ? input.querySelector("input") : input;
    focusTarget?.focus();
  }
}
