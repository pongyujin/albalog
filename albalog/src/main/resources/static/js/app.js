// /js/app.js
// 믿GO알바 - Demo App (Vanilla JS) SPA 엔트리
// - screens/* 모듈 연결
// - goto(screenKey)로 화면 전환 + 화면별 렌더 호출
// - 헤더 인증 UI 동기화 + 역할별 네비 적용
// - post UI/submit 바인딩

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
import { initPostUI /*, resetPostForm*/ } from "./post/post.ui.js";
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
// 2) Role UI (하단 네비 표시/숨김)
// - 네 기존 로직 유지: 로그인 안돼도 메뉴 보이게(요청사항 반영)
// ======================================================
function applyRoleUI(isOwner) {
  const navMyjobs = $("#nav-myjobs");
  const navResume = $("#nav-resume");
  const navOwner = $("#nav-owner");
  const navMessage = $("#nav-messages");

  // isOwner가 문자열로 들어오는 경우 방어
  let status = isOwner;
  if (isOwner === "false") status = false;
  if (isOwner === "true") status = true;

  // ✅ 로그인 여부 판단: true/false면 로그인, 그 외(null/undefined)이면 비로그인
  const isLoggedIn = status === true || status === false;

  // ✅ 비로그인: “모든 메뉴 표시” (너가 원하던 정책)
  if (!isLoggedIn) {
    if (navMyjobs) navMyjobs.style.display = "flex";
    if (navResume) navResume.style.display = "flex";
    if (navOwner) navOwner.style.display = "flex";
    if (navMessage) navMessage.style.display = "flex";
    return;
  }

  // ✅ 알바생
  if (status === false) {
    if (navMyjobs) navMyjobs.style.display = "flex";
    if (navResume) navResume.style.display = "flex";
    if (navMessage) navMessage.style.display = "flex";
    if (navOwner) navOwner.style.display = "none";
    return;
  }

  // ✅ 사장님
  if (status === true) {
    if (navMyjobs) navMyjobs.style.display = "none";
    if (navResume) navResume.style.display = "none";
    if (navMessage) navMessage.style.display = "flex";
    if (navOwner) navOwner.style.display = "flex";
  }
}

// ======================================================
// 3) Header Auth UI 동기화
// - /api/users/me로 세션 체크
// ======================================================
async function syncHeaderAuthUI() {
  const btn = $("#btn-header-login");
  if (!btn) return;

  try {
    const r = await getMe();

    // ✅ 로그인 상태
    if (r.ok) {
      const me = r.data; // { id, name, isOwner, ... }
      btn.textContent = `${me.name}님`;
      btn.onclick = () => goto("profile");
      applyRoleUI(me.isOwner);
      return;
    }

    // ✅ 비로그인
    btn.textContent = "로그인";
    btn.onclick = () => goto("login");
    applyRoleUI(null);
  } catch (e) {
    // 네트워크 에러도 비로그인 취급
    btn.textContent = "로그인";
    btn.onclick = () => goto("login");
    applyRoleUI(null);
  }
}

// ======================================================
// 4) SPA Navigation
// ======================================================
export async function goto(screenKey) {
  console.log("📱 화면 전환:", screenKey);

  // 1) 화면 active 토글
  Object.entries(screens).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("active", k === screenKey);
  });

  // 2) 하단 네비 active 토글
  $$(".nav-item").forEach((item) => {
    item.classList.toggle("active", item.dataset.target === screenKey);
  });

  // 로그인/회원가입/상세/지원/공고작성 등에서는 네비 active 해제
  if (["login", "signup", "detail", "apply", "post"].includes(screenKey)) {
    $$(".nav-item").forEach((item) => item.classList.remove("active"));
  }

  // 3) 화면별 진입 처리
  if (screenKey === "home") {
    await renderHomeScreen();
  }

  if (screenKey === "detail") {
    await renderDetailScreen();
  }

  if (screenKey === "apply") {
    await renderApplyScreen();
  }

  if (screenKey === "owner") {
    // owner 화면에서 “지원자 보기” 눌렀을 때 openApplicantsScreen으로 이동
    await renderOwnerScreen({ openApplicantsScreen });
  }

  if (screenKey === "applicants") {
    // applicants는 openApplicantsScreen(jobId)로 들어오는 게 기본이라
    // 여기서는 별도 렌더 없음(필요하면 빈 화면 처리 가능)
  }

  if (screenKey === "reviewWrite") {
    renderReviewWriteScreen();
  }

  if (screenKey === "resume") {
    // ✅ DOM 붙은 다음 실행 + 모드 분기(내 이력서/지원자 열람)
    await onEnterResumeScreen();
  }
  
  if (screenKey === "myjobs") {
    await renderMyJobsScreen();
  }


  // 4) 상단 스크롤
  window.scrollTo({ top: 0, behavior: "smooth" });
}

// ======================================================
// 5) Auth (login / signup / logout)
// ======================================================
function bindAuthHandlers() {
  // 로그아웃
  $("#btn-logout")?.addEventListener("click", async () => {
    try {
      await logout();
    } catch (e) {
      console.error(e);
      // 실패해도 UI는 비로그인처럼 전환
    }
    clearUser();
    alert("로그아웃!");
    await syncHeaderAuthUI();
    goto("home");
  });

  // 로그인
  $("#btn-login")?.addEventListener("click", async () => {
    const data = {
      username: $("#login-id")?.value.trim(),
      password: $("#login-pw")?.value.trim()
    };

    if (!data.username || !data.password) {
      alert("아이디와 비밀번호를 입력하세요.");
      return;
    }

    try {
      const me = await login(data); // { name, isOwner, ... } (서버 응답 기준)
      // (데모 저장소) 기존 로직 유지
      setUser({ id: data.username, nick: me?.name || "" });

      alert("로그인 성공!");
      await syncHeaderAuthUI();
      goto("home");
    } catch (e) {
      console.error(e);
      alert("아이디 또는 비밀번호가 틀렸습니다.");
    }
  });

  // 로그인 화면 -> 회원가입 이동
  $("#btn-go-signup")?.addEventListener("click", () => goto("signup"));

  // 회원가입
  $("#btn-signup-complete")?.addEventListener("click", async () => {
    try {
      const phoneEl = $("#signup-phone");
      if (!phoneEl) {
        alert("signup-phone input을 찾지 못했습니다. (id 확인)");
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
        alert("모든 항목을 입력하세요.");
        return;
      }

      if (!/^\d{10,11}$/.test(payload.phone)) {
        alert("전화번호를 올바르게 입력해줘! (숫자 10~11자리)");
        return;
      }

      await signup(payload);
      alert("회원가입 완료! 로그인 해주세요.");
      goto("login");
    } catch (e) {
      console.error(e);
      alert("회원가입 실패: " + (e?.message || e));
    }
  });
}

// ======================================================
// 6) Global nav bindings
// ======================================================
function bindGlobalNav() {
  // data-goto 버튼들(화면 내부 버튼)
  $$("[data-goto]").forEach((btn) => {
    btn.addEventListener("click", () => goto(btn.dataset.goto));
  });

  // 하단 네비
  $$(".nav-item").forEach((item) => {
    item.addEventListener("click", () => goto(item.dataset.target));
  });
}

// ======================================================
// 7) App init
// ======================================================
document.addEventListener("DOMContentLoaded", async () => {
  console.log("✅ app.js loaded");

  // 1) screens 초기화(이벤트 바인딩은 1회만)
  initHomeScreen({ goto });
  initDetailScreen({ goto });
  initApplyScreen({ goto });
  initOwnerScreen({ goto });
  initApplicantsScreen({ goto });
  initReviewWriteScreen({ goto });
  initResumeScreen({ goto });

  // 2) post 초기화(이벤트 바인딩 1회)
  initPostUI();
  initPostSubmit({ goto });

  // 3) 전역 네비/인증 바인딩
  bindGlobalNav();
  bindAuthHandlers();

  // 4) 세션 기준 헤더/네비 동기화
  await syncHeaderAuthUI();

  // 5) 첫 화면
  goto("home");
});
