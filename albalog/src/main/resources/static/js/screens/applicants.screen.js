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


let __goto = null;
let __bound = false;
// ✅ (추가) 공고 기준 "INITIAL 후기" 인덱스
// - key: applicationId (string/number를 모두 커버하려고 string으로 통일)
// - value: ReviewResponse(phase=INITIAL) 객체
let __initialReviewByAppId = new Map();

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
  // 3) INITIAL 후기만 골라서 Map 구성
  // - applicationId를 key로 사용
  // -------------------------------------------------------
  const map = new Map();
  const list = Array.isArray(r.data) ? r.data : [];

  for (const item of list) {
    // ✅ 방어: 필드가 없으면 스킵
    const phase = String(item?.phase || "").trim();
    const appId = item?.applicationId;

    if (!appId) continue;
    if (phase !== "INITIAL") continue;

    // ✅ key는 문자열로 통일 (dataset.id도 문자열이기 때문)
    map.set(String(appId), item);
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

	  // ✅ (수정) a에서 "지원서(application) id"를 확실히 뽑아낸다
	  // - 백엔드/DTO에 따라 필드명이 다를 수 있어서 방어적으로 처리
	  // - 여기 값이 __initialReviewByAppId의 key(review.applicationId)와 동일해야 버튼이 바뀜
	  const applicationId =
	    a.applicationId != null ? a.applicationId :     // 가장 흔한 케이스
	    a.id != null ? a.id : null;

	  // ✅ (수정) INITIAL 후기 존재 여부 확인 (key는 문자열 통일)
	  const initialReview = applicationId != null
	    ? __initialReviewByAppId.get(String(applicationId))
	    : null;

	  const hasInitial = !!initialReview;
	  
	  // ✅ (디버그) 버튼 상태가 왜 안 바뀌는지 확인용
	  // - applicationId가 뭔지
	  // - map에 그 key가 실제 존재하는지
	  console.log("[debug] card id fields:", {
	    a_id: a?.id,
	    a_applicationId: a?.applicationId,
	    picked_applicationId: applicationId,
	    hasInitial,
	    mapHasKey: applicationId != null ? __initialReviewByAppId.has(String(applicationId)) : false
	  });



	  // ✅ 버튼에 data-mode를 심어서 클릭 핸들러에서 분기
	  // - WRITE: 후기 작성 화면으로 이동
	  // - VIEW : 작성한 후기 보기(Swal)
	  const reviewBtn =
	    a.status === "ACCEPTED"
	      ? hasInitial
	        ? `<button class="btn outline review-btn" data-mode="VIEW">👀 작성한 후기 보기</button>`
	        : `<button class="btn outline review-btn" data-mode="WRITE">📝 후기 남기기</button>`
	      : "";

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

	if (e.target.classList.contains("review-btn")) {
	  e.preventDefault();
	  e.stopPropagation();

	  // ✅ 버튼 모드 확인 (없으면 기본 WRITE로 처리)
	  const mode = e.target.dataset.mode || "WRITE";

	  // =====================================================
	  // (A) WRITE: 후기 작성 화면으로 이동
	  // =====================================================
	  if (mode === "WRITE") {
	    state.selectedApplicationIdForReview = appId;
	    __goto?.("reviewWrite");
	    return;
	  }

	  // =====================================================
	  // (B) VIEW: 작성한 후기 보기 (Swal)
	  // - 이번 스텝에서는 INITIAL만 보여줌
	  // =====================================================
	  const review = __initialReviewByAppId.get(String(appId));

	  // ✅ 방어: 맵에 없으면 안내
	  if (!review) {
	    await Swal.fire({
	      icon: "info",
	      title: "후기 없음",
	      text: "작성된 후기를 찾을 수 없습니다.",
	      confirmButtonText: "확인"
	    });
	    return;
	  }

	  // ✅ 별점/코멘트/작성일 보여주기
	  // - createdAt 포맷은 서버 형식에 따라 다를 수 있어 일단 문자열 그대로 노출
	  await Swal.fire({
	    icon: "info",
	    title: "작성한 후기",
	    html: `
	      <div style="text-align:left; line-height:1.6;">
	        <div><b>단계</b>: ${review.phase}</div>
	        <div><b>별점</b>: ${review.rating}</div>
	        <div><b>코멘트</b>: ${String(review.comment || "").replaceAll("\n", "<br/>")}</div>
	        <div style="margin-top:8px; color:#666; font-size:12px;">
	          작성일: ${review.createdAt || "-"}
	        </div>
	      </div>
	    `,
	    confirmButtonText: "확인"
	  });

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
			  // ✅ (수정) 채용 직후에는 아직 후기가 없으니 WRITE 모드로 생성
			  `<button class="btn outline review-btn" data-mode="WRITE">📝 후기 남기기</button>`
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
	
	// ✅ (디버그) 지원자 데이터 구조 확인 (첫 3개만)
	// - 여기서 "지원서 id"가 어떤 필드인지 바로 보임 (a.id? a.applicationId? 다른 이름?)
	console.log("[debug] applicants.length:", applicants?.length);
	console.log("[debug] applicants sample:", (applicants || []).slice(0, 3));

	
	// ✅ (추가) 현재 jobId 저장
	__currentJobId = jobId;

	// ✅ (추가) INITIAL 후기 맵 생성
	__initialReviewByAppId = await buildInitialReviewMap(jobId);
	
	// ✅ (디버그) INITIAL 후기 Map 키 확인
	// - Map에 어떤 applicationId들이 들어가 있는지 (최대 10개)
	console.log("[debug] initialReviewMap.size:", __initialReviewByAppId?.size);

	const keys = Array.from(__initialReviewByAppId?.keys?.() || []).slice(0, 10);
	console.log("[debug] initialReviewMap.keys(sample):", keys);

	// ✅ (디버그) Map value 샘플 1개 확인
	const firstKey = keys[0];
	if (firstKey) {
	  console.log("[debug] initialReviewMap.firstValue:", __initialReviewByAppId.get(firstKey));
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
