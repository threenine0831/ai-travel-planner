export async function getAppConfig() {
  try {
    const module = await import("./app-config.js");
    return {
      apiBaseUrl: module.appConfig?.apiBaseUrl || "http://localhost:8000",
    };
  } catch {
    return {
      apiBaseUrl: "http://localhost:8000",
    };
  }
}
