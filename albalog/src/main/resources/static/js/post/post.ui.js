// /js/post/post.ui.js
// 공고 등록(Post) 화면의 UI 토글/시간 생성/요일 선택 로직 전담

import { $, $$ } from "../core/dom.js";

let __bound = false;

// UI 내부 상태(외부에서 getter로만 접근)
let __daysNegotiable = false;
let __timeNegotiable = false;

/**
 * ✅ 요일 협의 상태 getter
 * - post.submit.js에서 payload 만들 때 사용
 */
export function isDaysNegotiable() {
  return __daysNegotiable;
}

/**
 * ✅ 근무시간 협의 상태 getter
 * - post.submit.js에서 payload 만들 때 사용
 */
export function isTimeNegotiable() {
  return __timeNegotiable;
}

/**
 * ✅ UI 상태 초기화/바인딩
 * - goto("post")로 들어갈 때 한 번 호출하면 됨
 * - 이벤트 중복 바인딩 방지 처리 포함
 */
export function initPostUI() {
  if (__bound) return;
  __bound = true;

  // ======================================================
  // 1) Pay mode (amount/negotiable)
  // ======================================================
  const payMode = $("#pay-mode");
  const payAmountRow = $("#pay-amount-row");
  const payInput = $("#post-pay");

  function setPayMode(mode) {
    // mode: "amount" | "negotiable"
    payMode?.querySelectorAll(".seg-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });

    if (mode === "negotiable") {
      if (payAmountRow) payAmountRow.style.display = "none";
      if (payInput) payInput.value = "";
      payInput?.setAttribute("data-negotiable", "true"); // (참고용)
      return;
    }

    if (payAmountRow) payAmountRow.style.display = "flex";
    payInput?.removeAttribute("data-negotiable");
  }

  payMode?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setPayMode(btn.dataset.mode);
  });

  // ======================================================
  // 2) Days (요일 선택/협의)
  // ======================================================
  const dayWrap = $("#post-days");
  const dayBtns = Array.from(dayWrap?.querySelectorAll(".day") || []);
  const daysQuick = $("#days-quick");

  const groups = {
    weekdays: ["MON", "TUE", "WED", "THU", "FRI"],
    weekend: ["SAT", "SUN"],
    all: ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"]
  };

  function setDaysActive(dayCodes) {
    dayBtns.forEach((b) => b.classList.toggle("active", dayCodes.includes(b.dataset.day)));
  }

  function setDaysNegotiable(on) {
    __daysNegotiable = !!on;

    dayBtns.forEach((b) => {
      b.classList.toggle("ghost", __daysNegotiable);
      if (__daysNegotiable) b.classList.remove("active");
    });

    // quick 버튼 상태 초기화
    daysQuick?.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
    if (__daysNegotiable) {
      daysQuick?.querySelector('[data-quick="negotiable"]')?.classList.add("active");
    }
  }

  dayWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".day");
    if (!btn) return;

    // 협의면 개별 선택 막기
    if (__daysNegotiable) return;

    btn.classList.toggle("active");
  });

  daysQuick?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;

    const q = btn.dataset.quick;

    // 협의
    if (q === "negotiable") {
      setDaysNegotiable(true);
      return;
    }

    // 협의 해제
    setDaysNegotiable(false);

    // 전체 해제
    if (q === "clear") {
      setDaysActive([]);
      daysQuick.querySelectorAll(".seg-btn").forEach((b) => b.classList.remove("active"));
      return;
    }

    // 그룹 선택
    if (groups[q]) {
      setDaysActive(groups[q]);
      daysQuick.querySelectorAll(".seg-btn").forEach((b) => {
        b.classList.toggle("active", b.dataset.quick === q);
      });
    }
  });

  // ======================================================
  // 3) Time mode (select/custom/negotiable)
  // ======================================================
  const timeMode = $("#time-mode");
  const timeSelectRow = $("#time-select-row");
  const timeCustomRow = $("#time-custom-row");

  const startSel = $("#post-start");
  const endSel = $("#post-end");
  const stepSel = $("#time-step");

  const startCustom = $("#post-start-custom");
  const endCustom = $("#post-end-custom");

  function buildTimes(stepMinutes) {
    if (!startSel || !endSel) return;

    const step = Number(stepMinutes);
    const list = [];

    // 00:00 ~ 23:xx 생성
    for (let h = 0; h < 24; h++) {
      for (let m = 0; m < 60; m += step) {
        const hh = String(h).padStart(2, "0");
        const mm = String(m).padStart(2, "0");
        list.push(`${hh}:${mm}`);
      }
    }

    // ✅ 기존 코드와 동일한 옵션 구성
    startSel.innerHTML =
      `<option value="">시작</option>` + list.map((t) => `<option value="${t}">${t}</option>`).join("");

    endSel.innerHTML =
      `<option value="">종료</option>` + list.map((t) => `<option value="${t}">${t}</option>`).join("");
  }

  function setTimeMode(mode) {
    // mode: "select" | "custom" | "negotiable"
    timeMode?.querySelectorAll(".seg-btn").forEach((b) => {
      b.classList.toggle("active", b.dataset.mode === mode);
    });

    if (mode === "negotiable") {
      __timeNegotiable = true;

      if (timeSelectRow) timeSelectRow.style.display = "none";
      if (timeCustomRow) timeCustomRow.style.display = "none";

      // 값 초기화
      if (startSel) startSel.value = "";
      if (endSel) endSel.value = "";
      if (startCustom) startCustom.value = "";
      if (endCustom) endCustom.value = "";
      return;
    }

    __timeNegotiable = false;

    if (mode === "custom") {
      if (timeSelectRow) timeSelectRow.style.display = "none";
      if (timeCustomRow) timeCustomRow.style.display = "flex";
      return;
    }

    // select
    if (timeSelectRow) timeSelectRow.style.display = "flex";
    if (timeCustomRow) timeCustomRow.style.display = "none";
  }

  timeMode?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setTimeMode(btn.dataset.mode);
  });

  stepSel?.addEventListener("change", (e) => buildTimes(e.target.value));

  // ======================================================
  // 4) 초기 상태
  // ======================================================
  buildTimes(stepSel?.value || 30);
  setPayMode("amount");
  setTimeMode("select");
  setDaysNegotiable(false);
}

/**
 * ✅ (선택) post 화면 들어올 때 값들 기본 초기화가 필요하면 호출
 * - UX 차원에서 신규 등록 시 폼을 비우고 싶을 때 사용
 */
export function resetPostForm() {
  // 텍스트/숫자 입력 초기화
  $("#post-company") && ($("#post-company").value = "");
  $("#post-title") && ($("#post-title").value = "");
  $("#post-pay") && ($("#post-pay").value = "");
  $("#post-address") && ($("#post-address").value = "");
  $("#post-desc") && ($("#post-desc").value = "");

  // 지역 선택 초기화(원하는 기본값으로 바꿔도 됨)
  // $("#post-city") && ($("#post-city").value = "");
  // $("#post-district") && ($("#post-district").value = "");

  // 요일 버튼 초기화
  $$("#post-days .day").forEach((b) => b.classList.remove("active", "ghost"));
  __daysNegotiable = false;
  $$("#days-quick .seg-btn").forEach((b) => b.classList.remove("active"));

  // 시간 초기화
  $("#post-start") && ($("#post-start").value = "");
  $("#post-end") && ($("#post-end").value = "");
  $("#post-start-custom") && ($("#post-start-custom").value = "");
  $("#post-end-custom") && ($("#post-end-custom").value = "");
  __timeNegotiable = false;
}
