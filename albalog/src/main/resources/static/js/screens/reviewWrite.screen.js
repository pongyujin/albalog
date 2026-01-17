// /js/screens/reviewWrite.screen.js

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";

let __goto = null;
let __bound = false;

export function initReviewWriteScreen({ goto }) {
  __goto = goto;
  if (__bound) return;
  __bound = true;

  // 취소
  $("#btn-cancel-review")?.addEventListener("click", () => {
    state.reviewTargetAppId = null;
    __goto?.("applicants");
  });

  // (옵션) 제출 버튼이 있다면 여기서 처리
  // ex) $("#btn-submit-review")?.addEventListener("click", async () => { ... })
}

export function renderReviewWriteScreen() {
  // 기본 별점 5점
  const star5 = document.querySelector("#star5");
  if (star5) star5.checked = true;

  // 코멘트 초기화
  const comment = $("#review-comment");
  if (comment) comment.value = "";

  // 안내 문구
  const sub = $("#review-write-sub");
  const appId = state.selectedApplicationIdForReview || state.reviewTargetAppId;
  if (sub && appId) {
    sub.textContent = `지원 ID #${appId} 에 대한 후기를 남겨주세요.`;
  }
}
