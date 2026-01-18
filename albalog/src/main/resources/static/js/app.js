// /js/app.js
// 믿GO알바 - Demo App (Vanilla JS) SPA 엔트리

import { $, $$ } from "./core/dom.js";
import { store, setUser, clearUser } from "./core/store.js";
import { state } from "./core/state.js";

// API
import { getMe, login, signup, logout } from "./api/users.api.js";

// Screens
import { initHomeScreen, renderHomeScreen } from "./screens/home.screen.js";
import { initDetailScreen, renderDetailScreen } from "./screens/detail.screen.js";
import { initApplyScreen, renderApplyScreen } from "./screens/apply.screen.js";
import { initOwnerScreen, renderOwnerScreen } from "./screens/owner.screen.js";
import { initApplicantsScreen, openApplicantsScreen } from "./screens/applicants.screen.js";
import { initReviewWriteScreen, renderReviewWriteScreen } from "./screens/reviewWrite.screen.js";
import { initResumeScreen, onEnterResumeScreen } from "./screens/resume.screen.js";
import { renderMyJobsScreen } from "./screens/myjobs.screen.js";

// Post
import { initPostUI } from "./post/post.ui.js";
import { initPostSubmit } from "./post/post.submit.js";

// ======================================================
// 1) Screens DOM refs
// ======================================================
const screens = {
  home: $("#screen-home"),
  login: $("#screen-login"),
  signup: $("#screen-signup"),
  detail: $("#screen-detail"),
  apply: $("#screen-apply"),
  post: $("#screen-post"),
  resume: $("#screen-resume"),
  profile: $("#screen-profile"),
  messages: $("#screen-messages"),
  myjobs: $("#screen-myjobs"),
  reviews: $("#screen-reviews"),
  owner: $("#screen-owner"),
  applicants: $("#screen-applicants"),
  reviewWrite: $("#screen-review-write")
};

// ======================================================
// 2) Role UI
// ======================================================
function applyRoleUI(isOwner) {
  const navMyjobs = $("#nav-myjobs");
  const navResume = $("#nav-resume");
  const navOwner = $("#nav-owner");
  const navMessage = $("#nav-messages");

  let status = isOwner;
  if (isOwner === "false") status = false;
  if (isOwner === "true") status = true;

  const isLoggedIn = status === true || status === false;

  if (!isLoggedIn) {
    navMyjobs && (navMyjobs.style.display = "flex");
    navResume && (navResume.style.display = "flex");
    navOwner && (navOwner.style.display = "flex");
    navMessage && (navMessage.style.display = "flex");
    return;
  }

  if (status === false) {
    navMyjobs && (navMyjobs.style.display = "flex");
    navResume && (navResume.style.display = "flex");
    navMessage && (navMessage.style.display = "flex");
    navOwner && (navOwner.style.display = "none");
    return;
  }

  if (status === true) {
    navMyjobs && (navMyjobs.style.display = "none");
    navResume && (navResume.style.display = "none");
    navMessage && (navMessage.style.display = "flex");
    navOwner && (navOwner.style.display = "flex");
  }
}

// ======================================================
// 3) Header Auth UI
// ======================================================
async function syncHeaderAuthUI() {
  const btn = $("#btn-header-login");
  if (!btn) return;

  try {
    const r = await getMe();

    if (r.ok) {
      const me = r.data;
      btn.textContent = `${me.name}님`;
      btn.onclick = () => goto("profile");
      applyRoleUI(me.isOwner);
      return;
    }

    btn.textContent = "로그인";
    btn.onclick = () => goto("login");
    applyRoleUI(null);
  } catch {
    btn.textContent = "로그인";
    btn.onclick = () => goto("login");
    applyRoleUI(null);
  }
}

// ======================================================
// 4) SPA Navigation
// ======================================================
export async function goto(screenKey) {
  Object.entries(screens).forEach(([k, el]) => {
    el && el.classList.toggle("active", k === screenKey);
  });

  $$(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.target === screenKey);
  });

  if (["login", "signup", "detail", "apply", "post"].includes(screenKey)) {
    $$(".nav-item").forEach((item) => item.classList.remove("active"));
  }

  if (screenKey === "home") await renderHomeScreen();
  if (screenKey === "detail") await renderDetailScreen();
  if (screenKey === "apply") await renderApplyScreen();
  if (screenKey === "owner") await renderOwnerScreen({ openApplicantsScreen });
  if (screenKey === "reviewWrite") renderReviewWriteScreen();
  if (screenKey === "resume") await onEnterResumeScreen();
  if (screenKey === "myjobs") await renderMyJobsScreen();

  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======================================================
// 5) Auth Handlers (alert → Swal)
// ======================================================
function bindAuthHandlers() {
  // 로그아웃
  $("#btn-logout")?.addEventListener("click", async () => {
    try {
      await logout();
    } catch {}

    clearUser();

    await Swal.fire({
      icon: "success",
      title: "로그아웃",
      text: "정상적으로 로그아웃되었습니다.",
      confirmButtonText: "확인"
    });

    await syncHeaderAuthUI();
    goto("home");
  });

  // 로그인
  $("#btn-login")?.addEventListener("click", async () => {
    const username = $("#login-id")?.value.trim();
    const password = $("#login-pw")?.value.trim();

    if (!username || !password) {
      await Swal.fire({
        icon: "warning",
        title: "입력 확인",
        text: "아이디와 비밀번호를 입력하세요.",
        confirmButtonText: "확인"
      });
      return;
    }

    try {
      Swal.fire({
        title: "로그인 중...",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const me = await login({ username, password });
      setUser({ id: username, nick: me?.name || "" });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "로그인 성공",
        text: "환영합니다!",
        confirmButtonText: "확인"
      });

      await syncHeaderAuthUI();
      goto("home");
    } catch (e) {
      console.error(e);
      Swal.close();

      await Swal.fire({
        icon: "error",
        title: "로그인 실패",
        text: "아이디 또는 비밀번호가 올바르지 않습니다.",
        confirmButtonText: "확인"
      });
    }
  });

  // 로그인 → 회원가입
  $("#btn-go-signup")?.addEventListener("click", () => goto("signup"));

  // 회원가입
  $("#btn-signup-complete")?.addEventListener("click", async () => {
    try {
      const phoneEl = $("#signup-phone");
      if (!phoneEl) {
        await Swal.fire({
          icon: "error",
          title: "오류",
          text: "signup-phone input을 찾을 수 없습니다.",
          confirmButtonText: "확인"
        });
        return;
      }

      const payload = {
        username: $("#signup-id")?.value.trim(),
        password: $("#signup-pw")?.value.trim(),
        name: $("#signup-name")?.value.trim(),
        birth: $("#signup-birth")?.value,
        phone: phoneEl.value.trim().replace(/-/g, ""),
        isOwner: $("#signup-owner")?.checked || false
      };

      if (!payload.username || !payload.password || !payload.name || !payload.birth || !payload.phone) {
        await Swal.fire({
          icon: "warning",
          title: "입력 확인",
          text: "모든 항목을 입력하세요.",
          confirmButtonText: "확인"
        });
        return;
      }

      if (!/^\d{10,11}$/.test(payload.phone)) {
        await Swal.fire({
          icon: "warning",
          title: "전화번호 오류",
          text: "전화번호는 숫자 10~11자리여야 합니다.",
          confirmButtonText: "확인"
        });
        return;
      }

      await signup(payload);

      await Swal.fire({
        icon: "success",
        title: "회원가입 완료",
        text: "로그인해주세요.",
        confirmButtonText: "확인"
      });

      goto("login");
    } catch (e) {
      console.error(e);
      await Swal.fire({
        icon: "error",
        title: "회원가입 실패",
        text: e?.message || "회원가입 중 오류가 발생했습니다.",
        confirmButtonText: "확인"
      });
    }
  });
}

// ======================================================
// 6) Global nav bindings
// ======================================================
function bindGlobalNav() {
  $$("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goto(btn.dataset.goto));
  });

  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => goto(item.dataset.target));
  });
}

// ======================================================
// 7) App init
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  initHomeScreen({ goto });
  initDetailScreen({ goto });
  initApplyScreen({ goto });
  initOwnerScreen({ goto });
  initApplicantsScreen({ goto });
  initReviewWriteScreen({ goto });
  initResumeScreen({ goto });

  initPostUI();
  initPostSubmit({ goto });

  bindGlobalNav();
  bindAuthHandlers();

  await syncHeaderAuthUI();
  goto("home");
});
