import { waitForUser } from "./auth.js";

export async function requireAuthenticatedPage() {
  const user = await waitForUser();
  if (user) {
    return user;
  }
  const redirect = `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}`;
  window.location.href = `login.html?redirect=${encodeURIComponent(redirect)}`;
  return null;
}
