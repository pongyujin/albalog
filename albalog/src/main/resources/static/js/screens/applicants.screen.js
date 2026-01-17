// /js/screens/applicants.screen.js

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { formatDateYMDHM } from "../core/utils.js";
import {
  fetchApplicationsByJob,
  updateApplicationStatus,
  fetchResumeByApplication
} from "../api/applications.api.js";

let __goto = null;
let __bound = false;

function buildApplicantCard(a) {
  const skills = a.skills && a.skills.length > 0 ? a.skills.join(", ") : "보유 스킬 없음";
  const exps = a.experiences && a.experiences.length > 0 ? a.experiences.join(", ") : "경력 없음";

  const statusClass =
    a.status === "ACCEPTED" ? "accepted" : a.status === "REJECTED" ? "rejected" : "";

  const actionButtons =
    a.status === "ACCEPTED"
      ? `
        <div class="applicant-actions-vertical">
          <div class="hire-label">✅ 채용됨</div>
          <button class="btn message">메시지</button>
        </div>
      `
      : `
        <div class="applicant-actions-vertical">
          <button class="btn reject">거절</button>
          <button class="btn accept">채용</button>
          <button class="btn message">메시지</button>
        </div>
      `;

  const reviewBtn =
    a.status === "ACCEPTED" ? `<button class="btn outline review-btn">📝 후기 남기기</button>` : "";

  return `
    <div class="msg-card ${statusClass}" data-id="${a.id}">
      <div class="applicant-card-inner">
        <div class="applicant-info">
          <div class="msg-title">${a.applicantName || "이름 없음"} (${a.applicantAge || "-"}세)</div>
          <div class="msg-text">${a.description || "자기소개 없음"}</div>
          <div class="msg-meta">📞 ${a.applicantPhone || "비공개"} · 🕒 ${formatDateYMDHM(a.createdAt)}</div>
          <div class="msg-extra">💼 경력: ${exps}</div>
          <div class="msg-extra">🧩 스킬: ${skills}</div>
        </div>

        ${actionButtons}
      </div>

      ${reviewBtn}
    </div>
  `;
}

function openResumeViewMode(resume) {
  state.resumeMode = "APPLICANT";
  state.viewingResume = resume;
  __goto?.("resume");
}

export function initApplicantsScreen({ goto }) {
  __goto = goto;
  if (__bound) return;
  __bound = true;

  $("#btn-back-applicants")?.addEventListener("click", () => {
    state.resumeMode = "ME";
    state.viewingResume = null;
    __goto?.("applicants");
  });

  $("#applicants-list")?.addEventListener("click", async (e) => {
    const card = e.target.closest(".msg-card");
    if (!card) return;

    const appId = card.dataset.id;

    // 1) 후기 버튼
    if (e.target.classList.contains("review-btn")) {
      e.preventDefault();
      e.stopPropagation();
      state.selectedApplicationIdForReview = appId;
      __goto?.("reviewWrite");
      return;
    }

    // 2) 액션 영역
    if (e.target.closest(".applicant-actions-vertical")) {
      if (e.target.classList.contains("reject")) {
        if (!confirm("이 지원자를 거절하시겠습니까?")) return;
        try {
          await updateApplicationStatus(appId, "REJECTED");
          card.remove();
        } catch (err) {
          console.error(err);
          alert("상태 변경에 실패했습니다.");
        }
        return;
      }

      if (e.target.classList.contains("accept")) {
        if (!confirm("이 지원자를 채용하시겠습니까?")) return;
        try {
          await updateApplicationStatus(appId, "ACCEPTED");

          // UI 즉시 반영
          card.classList.add("accepted");
          card.classList.remove("rejected");

          const actions = card.querySelector(".applicant-actions-vertical");
          if (actions) {
            actions.innerHTML = `
              <div class="hire-label">✅ 채용됨</div>
              <button class="btn message">메시지</button>
            `;
          }

          if (!card.querySelector(".review-btn")) {
            card.insertAdjacentHTML("beforeend", `<button class="btn outline review-btn">📝 후기 남기기</button>`);
          }
        } catch (err) {
          console.error(err);
          alert("상태 변경에 실패했습니다.");
        }
        return;
      }

      if (e.target.classList.contains("message")) {
        alert("메시지 기능은 준비 중입니다.");
        return;
      }

      return;
    }

    // 3) 카드 클릭 = 이력서 열기
    try {
      const r = await fetchResumeByApplication(appId);
      if (!r.ok) {
        alert("이력서가 등록되지 않은 지원자입니다.");
        return;
      }
      openResumeViewMode(r.data);
    } catch (err) {
      console.error(err);
      alert("이력서를 불러오는 중 오류가 발생했습니다.");
    }
  });
}

export async function openApplicantsScreen(jobId) {
  try {
    const applicants = await fetchApplicationsByJob(jobId);
    const list = $("#applicants-list");
    if (!list) return;

    list.innerHTML =
      applicants.length === 0
        ? `<div class="empty">아직 지원자가 없습니다.</div>`
        : applicants.map((a) => buildApplicantCard(a)).join("");

    __goto?.("applicants");
  } catch (err) {
    console.error(err);
    alert("지원자 목록을 불러오는 중 오류가 발생했습니다.");
  }
}
