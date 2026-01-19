// /js/screens/reviewWrite.screen.js
// 후기 작성 화면 (SweetAlert2 적용)
// - 별점(rating) + 코멘트(comment) 입력 후
// - POST /api/reviews 로 저장
// - 성공 시 applicants로 이동

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { createReview } from "../api/reviews.api.js";

let __goto = null;
let __bound = false;

/**
 * ✅ 현재 선택된 별점 값 가져오기
 * - name="rating" 라디오 중 checked 찾기
 * - 없으면 null 반환
 */
function getSelectedRating() {
  // ⭐ 별점 그룹 내부에서 체크된 라디오 찾기
  const checked = document.querySelector('#review-rating input[name="rating"]:checked');
  if (!checked) return null;

  // value는 "5.0", "4.5" 같은 문자열 -> 숫자 변환
  const v = Number(checked.value);

  // NaN 방어
  if (!Number.isFinite(v)) return null;

  return v;
}

/**
 * ✅ 화면 초기화
 * - 기본 별점 5점
 * - 코멘트 초기화
 */
function resetForm() {
  // 기본 별점 5점 체크
  const star5 = document.querySelector("#star5");
  if (star5) star5.checked = true;

  // 코멘트 비우기
  const comment = $("#review-comment");
  if (comment) comment.value = "";
}

/**
 * ✅ Swal 로딩 표시
 * - 네 앱 톤과 어울리게 텍스트만 사용(스타일은 Swal 기본)
 */
function showLoading(title = "처리 중...", text = "잠시만 기다려주세요.") {
  Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    didOpen: () => Swal.showLoading()
  });
}

/**
 * ✅ Swal 에러 공통
 */
async function showError(title, text) {
  await Swal.fire({
    icon: "error",
    title,
    text,
    confirmButtonText: "확인"
  });
}

/**
 * ✅ Swal 안내 공통
 */
async function showInfo(title, text) {
  await Swal.fire({
    icon: "info",
    title,
    text,
    confirmButtonText: "확인"
  });
}

/**
 * ✅ Swal 성공 공통
 */
async function showSuccess(title, text) {
  await Swal.fire({
    icon: "success",
    title,
    text,
    confirmButtonText: "확인"
  });
}

/**
 * ✅ 제출 처리
 * - applicationId: state.selectedApplicationIdForReview 또는 state.reviewTargetAppId
 * - rating/comment 검증
 * - API 호출 후 성공/실패 처리
 */
async function onSubmitReview() {
  // -------------------------------------------------------
  // 1) applicationId 결정
  // -------------------------------------------------------
  const appId = state.selectedApplicationIdForReview || state.reviewTargetAppId;

  if (!appId) {
    await showError("대상 없음", "후기 대상(지원 ID)을 찾을 수 없습니다. 지원자 목록에서 다시 진입해주세요.");
    return;
  }

  // -------------------------------------------------------
  // 2) 입력값 수집/검증
  // -------------------------------------------------------
  const rating = getSelectedRating();
  const comment = ($("#review-comment")?.value || "").trim();

  // 별점 미선택
  if (rating == null) {
    await showInfo("별점 필요", "별점을 선택해주세요.");
    return;
  }

  // 코멘트 필수 (서버 comment NOT NULL)
  if (!comment) {
    await showInfo("코멘트 필요", "코멘트를 입력해주세요.");
    return;
  }
  // -------------------------------------------------------
  // 3) payload 구성 (서버 DTO: ReviewRequest)
  // - phase는 applicants 화면에서 state.reviewPhase로 세팅됨
  // - 없으면 안전하게 INITIAL로 기본값 처리
  // -------------------------------------------------------
  const payload = {
    applicationId: Number(appId),
    phase: state.reviewPhase || "INITIAL", // ✅ 추가: INITIAL/MONTH_1/MONTH_3
    rating: rating,                        // 0.5 단위
    comment: comment
  };


  // -------------------------------------------------------
  // 4) API 호출
  // -------------------------------------------------------
  try {
    // ✅ 로딩
    showLoading("후기 등록 중...", "후기를 저장하고 있습니다.");

    // ✅ 저장 요청
    await createReview(payload);

    // ✅ 로딩 닫기
    Swal.close();

    // ✅ 성공 알림
    await showSuccess("등록 완료", "후기가 성공적으로 등록되었습니다.");

    // ✅ 상태 정리 (다음 진입 시 꼬임 방지)
    state.reviewTargetAppId = null;
    state.selectedApplicationIdForReview = null;
	
	// ✅ 추가: 다음 후기 작성 시 꼬임 방지
	state.reviewPhase = null;

    // ✅ 지원자 목록으로 복귀
    __goto?.("applicants");
  } catch (e) {
    console.error(e);

    // 로딩이 떠있을 수 있으니 닫기
    Swal.close();

    const msg = String(e?.message || e);

    // ✅ 인증/권한 분기
    if (msg === "UNAUTHORIZED") {
      await showInfo("로그인이 필요합니다", "후기를 작성하려면 먼저 로그인해주세요.");
      __goto?.("login");
      return;
    }

    if (msg === "FORBIDDEN") {
      await showInfo("권한 없음", "사장님만 후기를 작성할 수 있습니다.");
      return;
    }

    // ✅ 중복 작성(서버 unique 제약 등) 가능성
    // - 서버가 텍스트로 "이미 작성됨" 같은 메시지를 내려주면 그대로 노출
    await showError("등록 실패", msg ? `후기 등록에 실패했습니다.\n(${msg})` : "후기 등록에 실패했습니다.");
  }
}

export function initReviewWriteScreen({ goto }) {
  __goto = goto;

  // ✅ 이벤트 중복 바인딩 방지
  if (__bound) return;
  __bound = true;

  // -------------------------------------------------------
  // 취소: 지원자 목록으로
  // -------------------------------------------------------
  $("#btn-cancel-review")?.addEventListener("click", async () => {
    // 상태 정리
    state.reviewTargetAppId = null;
    state.selectedApplicationIdForReview = null;
	
	// ✅ 추가: 다음 진입 시 phase가 남아있지 않게
	state.reviewPhase = null;

    __goto?.("applicants");
  });

  // -------------------------------------------------------
  // ✅ 제출 버튼
  // -------------------------------------------------------
  $("#btn-submit-review")?.addEventListener("click", onSubmitReview);
}

export function renderReviewWriteScreen() {
  // 화면 진입 시 폼 초기화
  resetForm();

  // 안내 문구
  const sub = $("#review-write-sub");
  const appId = state.selectedApplicationIdForReview || state.reviewTargetAppId;

  if (sub && appId) {
    sub.textContent = `지원 ID #${appId} 에 대한 후기를 남겨주세요.`;
  } else if (sub) {
    sub.textContent = "후기를 남겨주세요.";
  }
}
