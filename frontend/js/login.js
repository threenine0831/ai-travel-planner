import "./common.js";

import { signInWithEmail, signUpWithEmail, waitForUser } from "./auth.js";
import { authErrorMessage } from "./auth.js";
import { $, $all, onReady, setButtonLoading, showMessage } from "./ui.js";

function getRedirectTarget() {
  const params = new URLSearchParams(window.location.search);
  const redirect = params.get("redirect");
  return redirect && !redirect.startsWith("http") ? redirect : "index.html";
}

function setupTabs() {
  const tabs = $all("[data-auth-tab]");
  const panels = $all("[data-auth-panel]");

  function updateModeInUrl(target) {
    const url = new URL(window.location.href);
    url.searchParams.set("mode", target === "signup" ? "signup" : "login");
    window.history.replaceState(null, "", `${url.pathname}${url.search}${url.hash}`);
  }

  function selectTab(target, options = {}) {
    const selectedTab = target === "signup" ? "signup" : "login";
    tabs.forEach((item) => item.setAttribute("aria-selected", String(item.dataset.authTab === selectedTab)));
    panels.forEach((panel) => {
      panel.hidden = panel.dataset.authPanel !== selectedTab;
    });
    if (options.updateUrl) {
      updateModeInUrl(selectedTab);
    }
  }

  tabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      selectTab(tab.dataset.authTab, { updateUrl: true });
    });
  });

  const params = new URLSearchParams(window.location.search);
  selectTab(params.get("mode") === "signup" ? "signup" : "login");
}

async function setupAuthForms() {
  const existingUser = await waitForUser();
  const loggedInNotice = $("#logged-in-notice");
  if (existingUser && loggedInNotice) {
    loggedInNotice.hidden = false;
    loggedInNotice.textContent = `${existingUser.displayName || "여행자"}님으로 로그인되어 있습니다.`;
  }

  const loginForm = $("#login-form");
  const signupForm = $("#signup-form");
  const status = $("#auth-status");

  loginForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = loginForm.querySelector("button[type='submit']");
    try {
      setButtonLoading(button, true, "로그인 중...");
      await signInWithEmail({
        email: loginForm.elements.email.value.trim(),
        password: loginForm.elements.password.value,
      });
      window.location.href = getRedirectTarget();
    } catch (error) {
      showMessage(status, authErrorMessage(error), "error");
      setButtonLoading(button, false);
    }
  });

  signupForm?.addEventListener("submit", async (event) => {
    event.preventDefault();
    const button = signupForm.querySelector("button[type='submit']");
    const email = signupForm.elements.email.value.trim();
    const password = signupForm.elements.password.value;
    const passwordConfirm = signupForm.elements.passwordConfirm.value;
    const displayName = signupForm.elements.displayName.value.trim();
    if (!displayName) {
      showMessage(status, "닉네임을 입력해 주세요.", "error");
      signupForm.elements.displayName.focus();
      return;
    }
    if (password !== passwordConfirm) {
      showMessage(status, "비밀번호 확인이 일치하지 않습니다.", "error");
      signupForm.elements.passwordConfirm.focus();
      return;
    }
    try {
      setButtonLoading(button, true, "가입 중...");
      await signUpWithEmail({ email, password, displayName });
      window.location.href = getRedirectTarget();
    } catch (error) {
      showMessage(status, authErrorMessage(error), "error");
      setButtonLoading(button, false);
    }
  });
}

onReady(() => {
  setupTabs();
  setupAuthForms();
});
