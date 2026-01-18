// /js/screens/resume.screen.js

import { qs, qsa } from "../core/dom.js";
import { state } from "../core/state.js";
import { fmtPhone } from "../core/utils.js";
import { getMe } from "../api/users.api.js";
import { getMyResume, putMyResume } from "../api/resumes.api.js";

let __goto = null;
let __bound = false;

/* =======================
 * 내부 유틸
 * ======================= */
function clearInputs(node) {
  qsa("input, textarea", node).forEach((el) => (el.value = ""));
}

/* =======================
 * 토글 UI
 * ======================= */
function bindResumeToggles() {
  // 요일 버튼
  qsa("#resume-days .day").forEach((btn) => {
    btn.addEventListener("click", () => {
      const negActive = qs("#resume-days-neg")?.classList.contains("active");
      if (negActive) return;
      btn.classList.toggle("active");
    });
  });

  // 요일 협의
  const negBtn = qs("#resume-days-neg");
  if (negBtn) {
    negBtn.addEventListener("click", (e) => {
      e.currentTarget.classList.toggle("active");
      const isNeg = e.currentTarget.classList.contains("active");
      qsa("#resume-days .day").forEach((d) => {
        d.classList.toggle("ghost", isNeg);
        if (isNeg) d.classList.remove("active");
      });
    });
  }

  // 스킬 토글
  qsa("#resume-skills .seg-btn").forEach((btn) => {
    btn.addEventListener("click", () => btn.classList.toggle("active"));
  });
}

/* =======================
 * 경력 추가/삭제
 * ======================= */
function bindExperienceUI() {
  const expList = qs("#exp-list");
  const addBtn = qs("#btn-add-exp");
  if (!expList) return;

  function addExpItem() {
    const first = expList.querySelector(".exp-item");
    if (!first) return;
    const clone = first.cloneNode(true);
    clearInputs(clone);
    expList.appendChild(clone);
  }

  addBtn?.addEventListener("click", addExpItem);

  expList.addEventListener("click", (e) => {
    const btn = e.target.closest(".btn-remove-exp");
    if (!btn) return;

    const items = expList.querySelectorAll(".exp-item");
    const item = btn.closest(".exp-item");

    if (items.length <= 1) {
      clearInputs(item);
      return;
    }
    item.remove();
  });
}

/* =======================
 * users/me 기본정보
 * ======================= */
async function loadResumeProfile() {
  try {
    const r = await getMe();
    if (!r.ok) return;

    const data = r.data;
    const nameEl = qs("#resume-name");
    const ageEl = qs("#resume-age");
    const phoneEl = qs("#resume-phone");

    if (nameEl) nameEl.value = data.name || "";
    if (ageEl) ageEl.value = data.age != null ? data.age + "세" : "";
    if (phoneEl) phoneEl.value = fmtPhone(data.phone);
  } catch (e) {
    console.error("프로필 로드 실패:", e);
  }
}

/* =======================
 * 폼 -> payload
 * ======================= */
function getSelectedDays() {
  return qsa("#resume-days .day.active").map((b) => b.dataset.day);
}
function getSelectedSkills() {
  return qsa("#resume-skills .seg-btn.active").map((b) => b.dataset.skill);
}
function getExperiences() {
  return qsa("#exp-list .exp-item")
    .map((item) => {
      let store = (item.querySelector(".exp-store") || {}).value || "";
      let ind = (item.querySelector(".exp-industry") || {}).value || "";
      let period = (item.querySelector(".exp-period") || {}).value || "";
      let role = (item.querySelector(".exp-role") || {}).value || "";

      store = store.trim();
      ind = ind.trim();
      period = period.trim();
      role = role.trim();

      return { storeName: store, industry: ind, periodText: period, roleText: role };
    })
    .filter((e) => e.storeName || e.industry || e.periodText || e.roleText);
}

function buildResumePayload() {
  const wageEl = qs("#resume-wage");
  const wageRaw = wageEl ? wageEl.value : "";

  return {
    desiredWage: wageRaw ? Number(wageRaw) : null,
    wageNegotiable: !!qs("#resume-wage-neg")?.checked,

    days: getSelectedDays(),
    daysNegotiable: !!qs("#resume-days-neg")?.classList.contains("active"),

    timeStart: qs("#resume-time-start")?.value || null,
    timeEnd: qs("#resume-time-end")?.value || null,
    timeNegotiable: !!qs("#resume-time-neg")?.checked,

    introduction: qs("#resume-intro")?.value ? qs("#resume-intro").value.trim() : null,

    experiences: getExperiences(),
    skills: getSelectedSkills()
  };
}

/* =======================
 * DB -> UI 채우기
 * ======================= */
function setDaysUI(days, daysNegotiable) {
  days = days || [];
  const set = {};
  days.forEach((d) => (set[d] = true));

  const negBtn = qs("#resume-days-neg");
  if (negBtn) negBtn.classList.toggle("active", !!daysNegotiable);

  qsa("#resume-days .day").forEach((btn) => {
    btn.classList.toggle("ghost", !!daysNegotiable);
    btn.classList.toggle("active", !daysNegotiable && !!set[btn.dataset.day]);
  });
}

function setSkillsUI(skills) {
  skills = skills || [];
  const set = {};
  skills.forEach((s) => (set[s] = true));
  qsa("#resume-skills .seg-btn").forEach((btn) => btn.classList.toggle("active", !!set[btn.dataset.skill]));
}

function renderExperiences(exps) {
  const expList = qs("#exp-list");
  if (!expList) return;

  expList.innerHTML = "";

  function makeItem(exp) {
    exp = exp || {};
    const div = document.createElement("div");
    div.className = "exp-item";
    div.innerHTML = `
      <div class="row">
        <div class="input-group flex1">
          <label>근무처(가게명)</label>
          <input type="text" class="exp-store" placeholder="예) 스타카페 광주점" />
        </div>
        <div class="input-group flex1">
          <label>업종</label>
          <input type="text" class="exp-industry" placeholder="예) 카페, 편의점" />
        </div>
      </div>
      <div class="row">
        <div class="input-group flex1">
          <label>근무 기간</label>
          <input type="text" class="exp-period" placeholder="예) 2024.03 ~ 2024.09 / 6개월" />
        </div>
        <div class="input-group flex1">
          <label>역할</label>
          <input type="text" class="exp-role" placeholder="예) 음료 제조, 서빙, 마감" />
        </div>
      </div>
      <button type="button" class="btn danger small btn-remove-exp">삭제</button>
      <hr class="thin"/>
    `;

    div.querySelector(".exp-store").value = exp.storeName || "";
    div.querySelector(".exp-industry").value = exp.industry || "";
    div.querySelector(".exp-period").value = exp.periodText || "";
    div.querySelector(".exp-role").value = exp.roleText || "";

    return div;
  }

  if (!exps || exps.length === 0) {
    expList.appendChild(makeItem({}));
    return;
  }
  exps.forEach((exp) => expList.appendChild(makeItem(exp)));
}

function resetResumeForm() {
  qs("#resume-wage") && (qs("#resume-wage").value = "");
  qs("#resume-wage-neg") && (qs("#resume-wage-neg").checked = false);

  setDaysUI([], false);

  qs("#resume-time-start") && (qs("#resume-time-start").value = "");
  qs("#resume-time-end") && (qs("#resume-time-end").value = "");
  qs("#resume-time-neg") && (qs("#resume-time-neg").checked = false);

  qs("#resume-intro") && (qs("#resume-intro").value = "");

  renderExperiences([]);
  setSkillsUI([]);
}

async function loadResumeFromDB() {
  try {
    const r = await getMyResume();

    if (r.status === 204) {
      resetResumeForm();
      return;
    }
    if (r.status === 401) {
      // 화면은 띄우되 저장 시에 막히게 할 수도 있고, 바로 로그인 유도도 가능
      return;
    }
    if (!r.ok) {
      console.error("이력서 조회 실패:", r.status, r.text);
      return;
    }

    const data = r.data;

    qs("#resume-wage") && (qs("#resume-wage").value = data.desiredWage != null ? data.desiredWage : "");
    qs("#resume-wage-neg") && (qs("#resume-wage-neg").checked = !!data.wageNegotiable);

    setDaysUI(data.days || [], !!data.daysNegotiable);

    qs("#resume-time-start") && (qs("#resume-time-start").value = data.timeStart || "");
    qs("#resume-time-end") && (qs("#resume-time-end").value = data.timeEnd || "");
    qs("#resume-time-neg") && (qs("#resume-time-neg").checked = !!data.timeNegotiable);

    qs("#resume-intro") && (qs("#resume-intro").value = data.introduction || "");

    renderExperiences(data.experiences || []);
    setSkillsUI(data.skills || []);
  } catch (e) {
    console.error("이력서 불러오기 오류:", e);
  }
}

async function saveResumeToDB() {
  try {
    // =====================================================
    // 1) 저장 전 로딩 표시
    // =====================================================
    Swal.fire({
      title: "저장 중...",
      text: "이력서를 저장하고 있습니다.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const payload = buildResumePayload();
    await putMyResume(payload);

    // =====================================================
    // 2) 로딩 닫기 + 성공 알림
    // =====================================================
    Swal.close();

    await Swal.fire({
      icon: "success",
      title: "저장 완료",
      text: "이력서가 성공적으로 저장되었습니다.",
      confirmButtonText: "확인"
    });

  } catch (e) {
    console.error(e);

    // 로딩이 떠있을 수 있으니 닫기
    Swal.close();

    // =====================================================
    // 3) 인증 오류 (로그인 필요)
    // =====================================================
    if (String(e?.message || e) === "UNAUTHORIZED") {
      await Swal.fire({
        icon: "warning",
        title: "로그인이 필요합니다",
        text: "이력서를 저장하려면 먼저 로그인해주세요.",
        confirmButtonText: "확인"
      });

      __goto?.("login");
      return;
    }

    // =====================================================
    // 4) 기타 저장 실패
    // =====================================================
    await Swal.fire({
      icon: "error",
      title: "저장 실패",
      text: "이력서 저장 중 오류가 발생했습니다. 다시 시도해주세요.",
      confirmButtonText: "확인"
    });
  }
}


function bindSaveButton() {
  const btn = qs("#btn-save-resume");
  if (!btn) return;
  if (btn.dataset.bound === "1") return;
  btn.dataset.bound = "1";
  btn.addEventListener("click", saveResumeToDB);
}

/* =======================
 * 지원자 열람 모드
 * ======================= */
function fillResumeFormFromData(resume) {
  qs("#resume-name").value = resume.name || "이름 없음";
  qs("#resume-age").value = resume.age || "-";
  qs("#resume-phone").value = resume.phone || "비공개";

  qs("#resume-wage").value = resume.desiredWage ?? "";
  qs("#resume-wage-neg").checked = !!resume.wageNegotiable;

  setDaysUI(resume.days || [], !!resume.daysNegotiable);

  qs("#resume-time-start").value = resume.timeStart ?? "";
  qs("#resume-time-end").value = resume.timeEnd ?? "";
  qs("#resume-time-neg").checked = !!resume.timeNegotiable;

  qs("#resume-intro").value = resume.introduction ?? "";

  renderExperiences(resume.experiences || []);
  setSkillsUI(resume.skills || []);

  const title = document.querySelector("#screen-resume .screen-title");
  if (title) title.textContent = "지원자 이력서 열람";
}

function lockResumeViewMode() {
  const screen = document.querySelector("#screen-resume");
  if (!screen) return;

  screen.querySelectorAll("input, textarea, button").forEach((el) => {
    if (el.id === "btn-back-applicants") {
      el.disabled = false;
      el.style.display = "block";
      return;
    }
    if (el.id === "btn-save-resume" || el.id === "btn-add-exp") {
      el.style.display = "none";
      return;
    }
    el.disabled = true;
  });
}

/* =======================
 * 외부 API
 * ======================= */
export function initResumeScreen({ goto }) {
  __goto = goto;
  if (__bound) return;
  __bound = true;

  bindResumeToggles();
  bindExperienceUI();
  bindSaveButton();

  // 지원자 열람 모드에서 목록으로
  document.querySelector("#btn-back-applicants")?.addEventListener("click", () => {
    state.resumeMode = "ME";
    state.viewingResume = null;
    __goto?.("applicants");
  });
}

export async function onEnterResumeScreen() {
  // DOM 붙은 다음 실행이 안전
  await new Promise(requestAnimationFrame);

  if (state.resumeMode === "APPLICANT" && state.viewingResume) {
    fillResumeFormFromData(state.viewingResume);
    lockResumeViewMode();
    return;
  }

  // 내 이력서 모드
  state.resumeMode = "ME";
  state.viewingResume = null;

  // 화면 타이틀 원복(있으면)
  const title = document.querySelector("#screen-resume .screen-title");
  if (title) title.textContent = "내 이력서";

  // 입력 잠금 풀기(열람모드에서 돌아왔을 때)
  const screen = document.querySelector("#screen-resume");
  screen?.querySelectorAll("input, textarea, button").forEach((el) => {
    el.disabled = false;
    if (el.id === "btn-back-applicants") el.style.display = "none";
    if (el.id === "btn-save-resume" || el.id === "btn-add-exp") el.style.display = "";
  });

  await loadResumeProfile();
  await loadResumeFromDB();
}
