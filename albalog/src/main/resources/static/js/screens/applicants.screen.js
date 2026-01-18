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

/**
 * ✅ 지원자 카드 HTML 생성
 */
function buildApplicantCard(a) {
  const skills = a.skills && a.skills.length > 0 ? a.skills.join(", ") : "보유 스킬 없음";
  const exps = a.experiences && a.experiences.length > 0 ? a.experiences.join(", ") : "경력 없음";

  const statusClass =
    a.status === "ACCEPTED" ? "accepted" : a.status === "REJECTED" ? "rejected" : "";

  // ✅ 상태별 액션 버튼 UI
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

/**
 * ✅ 지원자 이력서 보기 모드로 이동
 */
function openResumeViewMode(resume) {
  state.resumeMode = "APPLICANT";
  state.viewingResume = resume;
  __goto?.("resume");
}

/**
 * ✅ applicants 화면 초기화(이벤트 바인딩 1회)
 */
export function initApplicantsScreen({ goto }) {
  __goto = goto;
  if (__bound) return;
  __bound = true;

  // (옵션) 지원자 이력서 열람 모드에서 "목록"으로 돌아가기 버튼
  $("#btn-back-applicants")?.addEventListener("click", () => {
    state.resumeMode = "ME";
    state.viewingResume = null;
    __goto?.("applicants");
  });

  // ✅ 지원자 카드 리스트 이벤트 위임
  $("#applicants-list")?.addEventListener("click", async (e) => {
    const card = e.target.closest(".msg-card");
    if (!card) return;

    const appId = card.dataset.id;

    // =====================================================
    // 1) 후기 버튼 (최우선)
    // =====================================================
    if (e.target.classList.contains("review-btn")) {
      e.preventDefault();
      e.stopPropagation();
      state.selectedApplicationIdForReview = appId;
      __goto?.("reviewWrite");
      return;
    }

    // =====================================================
    // 2) 액션 버튼 영역(거절/채용/메시지)
    // =====================================================
    if (e.target.closest(".applicant-actions-vertical")) {
      // (A) 거절
      if (e.target.classList.contains("reject")) {
        const result = await Swal.fire({
          icon: "warning",
          title: "지원자를 거절할까요?",
          text: "거절 후에는 되돌릴 수 없습니다.",
          showCancelButton: true,
          confirmButtonText: "거절하기",
          cancelButtonText: "취소",
          confirmButtonColor: "#e74c3c",
          cancelButtonColor: "#b0b0b0"
        });

        if (!result.isConfirmed) return;

        try {
          Swal.fire({
            title: "처리 중...",
            text: "잠시만 기다려주세요.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          await updateApplicationStatus(appId, "REJECTED");

          Swal.close();
          card.remove();

          await Swal.fire({
            icon: "success",
            title: "거절 완료",
            text: "해당 지원자를 거절했습니다.",
            confirmButtonText: "확인"
          });
        } catch (err) {
          console.error(err);
          Swal.close();

          await Swal.fire({
            icon: "error",
            title: "처리 실패",
            text: "상태 변경에 실패했습니다. 다시 시도해주세요.",
            confirmButtonText: "확인"
          });
        }

        return;
      }

      // (B) 채용
      if (e.target.classList.contains("accept")) {
        const result = await Swal.fire({
          icon: "question",
          title: "지원자를 채용할까요?",
          text: "채용 처리 후에는 후기 작성이 가능해집니다.",
          showCancelButton: true,
          confirmButtonText: "채용하기",
          cancelButtonText: "취소",
          confirmButtonColor: "#2ecc71",
          cancelButtonColor: "#b0b0b0"
        });

        if (!result.isConfirmed) return;

        try {
          Swal.fire({
            title: "처리 중...",
            text: "잠시만 기다려주세요.",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
          });

          await updateApplicationStatus(appId, "ACCEPTED");

          Swal.close();

          // ✅ UI 즉시 반영
          card.classList.add("accepted");
          card.classList.remove("rejected");

          // ✅ 버튼 영역을 "채용됨 + 메시지"로 교체
          const actions = card.querySelector(".applicant-actions-vertical");
          if (actions) {
            actions.innerHTML = `
              <div class="hire-label">✅ 채용됨</div>
              <button class="btn message">메시지</button>
            `;
          }

          // ✅ 후기 버튼 없으면 추가
          if (!card.querySelector(".review-btn")) {
            card.insertAdjacentHTML(
              "beforeend",
              `<button class="btn outline review-btn">📝 후기 남기기</button>`
            );
          }

          await Swal.fire({
            icon: "success",
            title: "채용 완료",
            text: "해당 지원자를 채용 처리했습니다.",
            confirmButtonText: "확인"
          });
        } catch (err) {
          console.error(err);
          Swal.close();

          await Swal.fire({
            icon: "error",
            title: "처리 실패",
            text: "상태 변경에 실패했습니다. 다시 시도해주세요.",
            confirmButtonText: "확인"
          });
        }

        return;
      }

      // (C) 메시지
      if (e.target.classList.contains("message")) {
        await Swal.fire({
          icon: "info",
          title: "준비 중",
          text: "메시지 기능은 준비 중입니다.",
          confirmButtonText: "확인"
        });
        return;
      }

      // 액션 영역이면 여기서 종료
      return;
    }

    // =====================================================
    // 3) 카드 클릭 = 이력서 열기
    // =====================================================
    try {
      Swal.fire({
        title: "불러오는 중...",
        text: "이력서를 가져오고 있습니다.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      const r = await fetchResumeByApplication(appId);

      Swal.close();

      if (!r.ok) {
        await Swal.fire({
          icon: "info",
          title: "이력서 없음",
          text: "이력서가 등록되지 않은 지원자입니다.",
          confirmButtonText: "확인"
        });
        return;
      }

      openResumeViewMode(r.data);
    } catch (err) {
      console.error(err);
      Swal.close();

      await Swal.fire({
        icon: "error",
        title: "불러오기 실패",
        text: "이력서를 불러오는 중 오류가 발생했습니다.",
        confirmButtonText: "확인"
      });
    }
  });
}

/**
 * ✅ 특정 공고의 지원자 목록을 불러와 applicants 화면으로 이동
 */
export async function openApplicantsScreen(jobId) {
  try {
    Swal.fire({
      title: "불러오는 중...",
      text: "지원자 목록을 가져오고 있습니다.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const applicants = await fetchApplicationsByJob(jobId);

    Swal.close();

    const list = $("#applicants-list");
    if (!list) {
      await Swal.fire({
        icon: "error",
        title: "화면 오류",
        text: "지원자 목록 영역(#applicants-list)을 찾을 수 없습니다.",
        confirmButtonText: "확인"
      });
      return;
    }

    list.innerHTML =
      applicants.length === 0
        ? `<div class="empty">아직 지원자가 없습니다.</div>`
        : applicants.map((a) => buildApplicantCard(a)).join("");

    __goto?.("applicants");
  } catch (err) {
    console.error(err);
    Swal.close();

    await Swal.fire({
      icon: "error",
      title: "불러오기 실패",
      text: "지원자 목록을 불러오는 중 오류가 발생했습니다.",
      confirmButtonText: "확인"
    });
  }
}
