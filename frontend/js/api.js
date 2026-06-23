import { getAppConfig } from "./app-config-loader.js";

async function parseResponse(response) {
  const contentType = response.headers.get("content-type") || "";
  if (contentType.includes("application/json")) {
    return response.json();
  }
  return { error: { code: "UNKNOWN_ERROR", message: "서버 응답을 읽을 수 없습니다." } };
}

export async function generateItinerary(payload, idToken) {
  const { apiBaseUrl } = await getAppConfig();
  const response = await fetch(`${apiBaseUrl.replace(/\/$/, "")}/api/generate-itinerary`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${idToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(payload),
  });
  const data = await parseResponse(response);
  if (!response.ok) {
    const error = new Error(data?.error?.message || "AI 일정 생성에 실패했습니다.");
    error.code = data?.error?.code || "API_ERROR";
    error.status = response.status;
    throw error;
  }
  return data;
}
