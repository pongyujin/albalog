// /js/screens/applicants.screen.js

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { formatDateYMDHM } from "../core/utils.js";
import {
  fetchApplicationsByJob,
  updateApplicationStatus,
  fetchResumeByApplication
} from "../api/applications.api.js";
// ✅ (추가) 공고 기준 후기 조회
// - 지원자 목록에서 "이미 후기 작성했는지" 판단하기 위해 사용
import { getReviewsByJob } from "../api/reviews.api.js";

import { openChatScreen } from "./chat.screen.js";



let __goto = null;
let __bound = false;

// ✅ (수정) 공고 기준 "후기" 인덱스 (phase별로 저장)
// - key: applicationId(string)
// - value: { INITIAL?: review, MONTH_1?: review, MONTH_3?: review }
let __reviewsByAppId = new Map();

// ✅ (추가) 현재 applicants 화면이 보고 있는 jobId 저장
// - openApplicantsScreen(jobId)에서 세팅
let __currentJobId = null;


/**
 * ✅ (추가) 공고(jobId) 기준 후기 목록을 불러와서
 * "INITIAL 후기만" applicationId로 빠르게 찾을 수 있게 Map으로 만든다.
 *
 * - 이번 스텝은 INITIAL만 사용
 * - MONTH_1/MONTH_3는 다음 스텝에서 같은 방식으로 확장 가능
 *
 * @param {number|string} jobId
 * @returns {Promise<Map<string, any>>}  // value는 ReviewResponse(초기후기)
 */
async function buildInitialReviewMap(jobId) {
  // -------------------------------------------------------
  // 1) API 호출
  // -------------------------------------------------------
  const r = await getReviewsByJob(jobId);

  // -------------------------------------------------------
  // 2) 실패해도 화면이 죽으면 안 됨
  // - 후기는 "부가 정보"라서, 지원자 목록은 우선 보여야 함
  // -------------------------------------------------------
  if (!r?.ok) {
    console.warn("[reviews] 공고 기준 후기 조회 실패:", r?.status, r?.text);
    return new Map();
  }

  // -------------------------------------------------------
  // 3) phase별로 Map 구성
  // - applicationId를 key로 사용
  // -------------------------------------------------------
  const map = new Map();
  const list = Array.isArray(r.data) ? r.data : [];

  for (const item of list) {
    // ✅ phase는 서버에서 내려오는 상태(확인 완료)
    const phase = String(item?.phase || "").trim();
    const appId = item?.applicationId;

    if (!appId) continue;
    if (!phase) continue;

    const key = String(appId);

    // ✅ applicationId별 묶음 객체 준비
    if (!map.has(key)) map.set(key, {});

    // ✅ 해당 phase에 review 저장
    map.get(key)[phase] = item;
  }

  return map;
}

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

  // -------------------------------------------------------
  // ✅ (버튼 UX 정리) 후기 버튼 렌더링 규칙
  // - 보기 버튼: 작성된 후기가 1개라도 있으면 "VIEW_ALL" 1개만 노출
  // - 작성 버튼: 작성 가능할 때만 노출 (대기중/disabled 버튼 없음)
  // -------------------------------------------------------

  // ✅ applicationId 결정 (dataset.id에 들어갈 값)
  const applicationId =
    a.applicationId != null ? a.applicationId :
    a.id != null ? a.id : null;

  // ✅ 후기 묶음(bucket)
  const bucket = applicationId != null
    ? (__reviewsByAppId.get(String(applicationId)) || {})
    : {};

  // ✅ 후기 존재 여부(각 phase)
  const hasInitial = !!bucket["INITIAL"];
  const hasMonth1  = !!bucket["MONTH_1"];
  const hasMonth3  = !!bucket["MONTH_3"];

  // ✅ 후기 1개라도 있으면 보기 버튼 노출
  const reviewCount = [hasInitial, hasMonth1, hasMonth3].filter(Boolean).length;

  // ✅ 채용 시각 기반 작성 가능 여부
  const acceptedAt = a?.acceptedAt ? new Date(a.acceptedAt) : null;
  const acceptedOk = acceptedAt && !Number.isNaN(acceptedAt.getTime());

  const month1Ready = acceptedOk
    ? (Date.now() >= acceptedAt.getTime() + 30 * 24 * 60 * 60 * 1000)
    : false;

  const month3Ready = acceptedOk
    ? (Date.now() >= acceptedAt.getTime() + 90 * 24 * 60 * 60 * 1000)
    : false;

  // ✅ 1) 작성한 후기 보기 (VIEW_ALL)
  const viewAllBtn =
    a.status === "ACCEPTED" && reviewCount > 0
      ? `<button class="btn outline review-btn" data-mode="VIEW_ALL">👀 작성한 후기 보기</button>`
      : "";

  // ✅ 2) INITIAL 작성 (없을 때만)
  const writeInitialBtn =
    a.status === "ACCEPTED" && !hasInitial
      ? `<button class="btn outline review-btn" data-phase="INITIAL" data-mode="WRITE">📝 후기 남기기</button>`
      : "";

  // ✅ 3) 1개월 작성 (가능할 때만)
  const writeMonth1Btn =
    a.status === "ACCEPTED" && month1Ready && !hasMonth1
      ? `<button class="btn outline review-btn" data-phase="MONTH_1" data-mode="WRITE">📝 1개월 후기 작성하기</button>`
      : "";

  // ✅ 4) 3개월 작성 (가능할 때만)
  const writeMonth3Btn =
    a.status === "ACCEPTED" && month3Ready && !hasMonth3
      ? `<button class="btn outline review-btn" data-phase="MONTH_3" data-mode="WRITE">📝 3개월 후기 작성하기</button>`
      : "";

  // ✅ 최종 버튼 묶음(세로 스택)
  const reviewBtns =
    a.status === "ACCEPTED"
      ? `<div class="applicant-review-actions">
           ${viewAllBtn}
           ${writeInitialBtn}
           ${writeMonth1Btn}
           ${writeMonth3Btn}
         </div>`
      : "";

  // ✅ card dataset.id에는 "applicationId"를 넣어야 click handler에서 appId로 바로 씀
  return `
    <div class="msg-card ${statusClass}" data-id="${applicationId ?? a.id}">
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

      ${reviewBtns}
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
  
  // ======================================================
// ✅ 지원자 카드 리스트 이벤트 위임 (최종)
// - 후기 버튼
// - 거절 / 채용 / 메시지
// - 카드 클릭 → 이력서 열기
// ======================================================
$("#applicants-list")?.addEventListener("click", async (e) => {

  // --------------------------------------------------
  // 0) 카드 찾기 (모든 동작의 기준)
  // --------------------------------------------------
  const card = e.target.closest(".msg-card");
  if (!card) return;

  const appId = card.dataset.id;
  if (!appId) return;

  // ==================================================
  // 1) 후기 버튼 처리
  // ==================================================
  const reviewBtn = e.target.closest(".review-btn");
  if (reviewBtn) {
    e.preventDefault();
    e.stopPropagation();

    const mode  = reviewBtn.dataset.mode || "WRITE";
    const phase = reviewBtn.dataset.phase || "INITIAL";

    // -----------------------------
    // (A) WRITE → 후기 작성 화면
    // -----------------------------
    if (mode === "WRITE") {
      state.selectedApplicationIdForReview = appId;
      state.reviewPhase = phase; // INITIAL / MONTH_1 / MONTH_3
      __goto?.("reviewWrite");
      return;
    }

    // -----------------------------
    // (B) VIEW_ALL → 후기 전체 보기
    // -----------------------------
    if (mode === "VIEW_ALL") {
      const bucket = __reviewsByAppId.get(String(appId)) || {};

      const orderedPhases = ["INITIAL", "MONTH_1", "MONTH_3"];
      const reviews = orderedPhases
        .map((p) => bucket[p])
        .filter(Boolean);

      if (reviews.length === 0) {
        await Swal.fire({
          icon: "info",
          title: "후기 없음",
          text: "작성된 후기가 없습니다.",
          confirmButtonText: "확인"
        });
        return;
      }

      const phaseLabel = (p) => {
        if (p === "INITIAL") return "채용 직후 후기";
        if (p === "MONTH_1") return "1개월 후기";
        if (p === "MONTH_3") return "3개월 후기";
        return p;
      };

      const html = reviews.map((r) => `
        <div style="margin-bottom:16px; padding-bottom:12px; border-bottom:1px solid #eee; text-align:left;">
          <div style="font-weight:bold; margin-bottom:6px;">
            ${phaseLabel(r.phase)}
          </div>
          <div>⭐ 별점: ${r.rating}</div>
          <div style="margin-top:4px;">
            ${String(r.comment || "").replaceAll("\n", "<br/>")}
          </div>
          <div style="margin-top:6px; font-size:12px; color:#666;">
            작성일: ${r.createdAt || "-"}
          </div>
        </div>
      `).join("");

      await Swal.fire({
        icon: "info",
        title: "작성한 후기",
        html,
        width: 540,
        confirmButtonText: "확인"
      });
      return;
    }

    console.warn("[review-btn] unknown mode:", mode);
    return;
  }

  // ==================================================
  // 2) 액션 버튼 영역 (거절 / 채용 / 메시지)
  // ==================================================
  const actionArea = e.target.closest(".applicant-actions-vertical");
  if (actionArea) {

    // -----------------------------
    // (A) 거절
    // -----------------------------
    if (e.target.classList.contains("reject")) {
      const result = await Swal.fire({
        icon: "warning",
        title: "지원자를 거절할까요?",
        text: "거절 후에는 되돌릴 수 없습니다.",
        showCancelButton: true,
        confirmButtonText: "거절하기",
        cancelButtonText: "취소"
      });

      if (!result.isConfirmed) return;

      await updateApplicationStatus(appId, "REJECTED");

      card.classList.add("rejected");
      card.classList.remove("accepted");

      await Swal.fire({
        icon: "success",
        title: "거절 완료",
        confirmButtonText: "확인"
      });
      return;
    }

    // -----------------------------
    // (B) 채용
    // -----------------------------
    if (e.target.classList.contains("accept")) {
      const result = await Swal.fire({
        icon: "question",
        title: "지원자를 채용할까요?",
        showCancelButton: true,
        confirmButtonText: "채용하기",
        cancelButtonText: "취소"
      });

      if (!result.isConfirmed) return;

      await updateApplicationStatus(appId, "ACCEPTED");

      card.classList.add("accepted");
      card.classList.remove("rejected");

      const actions = card.querySelector(".applicant-actions-vertical");
      if (actions) {
        actions.innerHTML = `
          <div class="hire-label">✅ 채용됨</div>
          <button class="btn message">메시지</button>
        `;
      }

      await Swal.fire({
        icon: "success",
        title: "채용 완료",
        confirmButtonText: "확인"
      });
      return;
    }

    // -----------------------------
    // (C) 메시지
    // -----------------------------
	if (e.target.classList.contains("message")) {
	  if (!appId) {
	    await Swal.fire({
	      icon: "error",
	      title: "오류",
	      text: "applicationId를 찾을 수 없습니다.",
	      confirmButtonText: "확인"
	    });
	    return;
	  }

	  openChatScreen({
	    applicationId: Number(appId),
	    backTo: "applicants"
	  });
	  return;
	}


    return;
  }

  // ==================================================
  // 3) 카드 클릭 → 이력서 열기
  // ==================================================
  try {
    Swal.fire({
      title: "불러오는 중...",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const r = await fetchResumeByApplication(appId);
    Swal.close();

    if (!r.ok) {
      await Swal.fire({
        icon: "info",
        title: "이력서 없음",
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
	
	// ✅ (디버그) 지원자 데이터 구조 확인 (첫 3개만)
	// - 여기서 "지원서 id"가 어떤 필드인지 바로 보임 (a.id? a.applicationId? 다른 이름?)
	console.log("[debug] applicants.length:", applicants?.length);
	console.log("[debug] applicants sample:", (applicants || []).slice(0, 3));
	console.log("[debug] acceptedAt:", applicants?.[0]?.acceptedAt);

	
	// ✅ (추가) 현재 jobId 저장
	__currentJobId = jobId;

	// ✅ (추가) INITIAL 후기 맵 생성
	// ✅ (수정) 후기 맵 생성 (phase별 저장)
	__reviewsByAppId = await buildInitialReviewMap(jobId);

	
	// ✅ (디버그) INITIAL 후기 Map 키 확인
	// - Map에 어떤 applicationId들이 들어가 있는지 (최대 10개)
	console.log("[debug] __reviewsByAppId.size:", __reviewsByAppId?.size);

	const keys = Array.from(__reviewsByAppId?.keys?.() || []).slice(0, 10);
	console.log("[debug] __reviewsByAppId.keys(sample):", keys);

	// ✅ (디버그) Map value 샘플 1개 확인
	const firstKey = keys[0];
	if (firstKey) {
	  console.log("[debug] __reviewsByAppId.firstValue:", __reviewsByAppId.get(firstKey));
	}


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
