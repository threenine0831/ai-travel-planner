import { logoutUser, onUserStateChange } from "./auth.js";
import { $, $all, onReady, showMessage } from "./ui.js";
import { getFirebaseErrorMessage } from "./firebase.js";

function setupNavigation() {
  const toggle = $("[data-nav-toggle]");
  const nav = $("[data-site-nav]");
  toggle?.addEventListener("click", () => {
    const expanded = toggle.getAttribute("aria-expanded") === "true";
    toggle.setAttribute("aria-expanded", String(!expanded));
    nav?.classList.toggle("is-open", !expanded);
  });

  const current = window.location.pathname.split("/").pop() || "index.html";
  $all("[data-nav-link]").forEach((link) => {
    const href = link.getAttribute("href");
    if (href === current) {
      link.setAttribute("aria-current", "page");
    }
  });
}

function setupAuthMenu() {
  const userName = $("[data-auth-user]");
  const loginLinks = $all("[data-login-link]");
  const signupLinks = $all("[data-signup-link]");
  const logoutButtons = $all("[data-logout-button]");
  const authMessage = $("[data-auth-message]");

  onUserStateChange((user, error) => {
    if (error) {
      showMessage(authMessage, getFirebaseErrorMessage(error), "warning");
    }
    if (user) {
      if (userName) {
        userName.textContent = `${user.displayName || "여행자"}님`;
        userName.hidden = false;
      }
      loginLinks.forEach((link) => { link.hidden = true; });
      signupLinks.forEach((link) => { link.hidden = true; });
      logoutButtons.forEach((button) => { button.hidden = false; });
    } else {
      if (userName) {
        userName.textContent = "";
        userName.hidden = true;
      }
      loginLinks.forEach((link) => { link.hidden = false; });
      signupLinks.forEach((link) => { link.hidden = false; });
      logoutButtons.forEach((button) => { button.hidden = true; });
    }
  });

  logoutButtons.forEach((button) => {
    button.addEventListener("click", async () => {
      try {
        await logoutUser();
        window.location.href = "index.html";
      } catch (error) {
        showMessage(authMessage, getFirebaseErrorMessage(error), "error");
      }
    });
  });
}

onReady(() => {
  setupNavigation();
  setupAuthMenu();
});
