// /js/post/post.submit.js
// 공고 등록 submit(검증 + API 호출) 전담

import { $ , $$ } from "../core/dom.js";
import { createOwnerJobPost } from "../api/jobs.api.js";
import { isDaysNegotiable, isTimeNegotiable } from "./post.ui.js";

let __bound = false;
let __goto = null;

/**
 * active seg-btn에서 dataset 값 읽기
 * - 예: getActiveDataValue("#pay-mode", "mode") -> "amount" | "negotiable"
 */
function getActiveDataValue(groupSelector, dataKey) {
  const activeBtn = document.querySelector(`${groupSelector} .seg-btn.active`);
  return activeBtn ? activeBtn.dataset[dataKey] : null;
}

/**
 * ✅ 등록 버튼 바인딩 (1회)
 * - app.js에서 initPostSubmit({ goto }) 호출해두면 됨
 */
export function initPostSubmit({ goto }) {
  __goto = goto;
  if (__bound) return;
  __bound = true;

  $("#btn-post-submit")?.addEventListener("click", onSubmitPost);
}

/**
 * ✅ 실제 submit 핸들러
 * - 기존 main.js 로직과 동일한 payload/검증 흐름 유지
 */
async function onSubmitPost() {
  // --------------------------------------------
  // 1) 입력값 수집
  // --------------------------------------------
  const storeName = $("#post-company")?.value.trim();
  const title = $("#post-title")?.value.trim();

  const payMode = getActiveDataValue("#pay-mode", "mode");   // "amount" | "negotiable"
  const timeMode = getActiveDataValue("#time-mode", "mode"); // "select" | "custom" | "negotiable"

  const wageNegotiable = payMode === "negotiable";
  const wage = wageNegotiable ? null : Number($("#post-pay")?.value);

  // 요일
  const daysNegotiable = isDaysNegotiable();
  const days = daysNegotiable ? [] : $$("#post-days .day.active").map((b) => b.dataset.day);

  // 시간
  const timeNegotiable = timeMode === "negotiable" || isTimeNegotiable();
  let timeStart = null;
  let timeEnd = null;

  if (!timeNegotiable) {
    if (timeMode === "select") {
      timeStart = $("#post-start")?.value || null;
      timeEnd = $("#post-end")?.value || null;
    } else if (timeMode === "custom") {
      timeStart = $("#post-start-custom")?.value || null;
      timeEnd = $("#post-end-custom")?.value || null;
    }
  }

  const regionCity = $("#post-city")?.value;
  const regionDistrict = $("#post-district")?.value;
  const addressDetail = $("#post-address")?.value.trim();
  const description = $("#post-desc")?.value.trim();

  // --------------------------------------------
  // 2) 필수 검증(기존 로직 유지)
  // --------------------------------------------
  if (!storeName || !title || !regionCity || !regionDistrict) {
    alert("가게이름/공고제목/근무지역(시·구)은 필수야!");
    return;
  }

  if (!wageNegotiable && (!wage || wage <= 0)) {
    alert("시급 금액을 입력하거나 '협의'를 선택해줘!");
    return;
  }

  if (!daysNegotiable && days.length === 0) {
    alert("근무요일을 선택하거나 '협의'를 선택해줘!");
    return;
  }

  if (!timeNegotiable && (!timeStart || !timeEnd)) {
    alert("근무시간을 입력하거나 '협의'를 선택해줘!");
    return;
  }

  // --------------------------------------------
  // 3) payload 구성
  // --------------------------------------------
  const payload = {
    storeName,
    title,
    wage,
    wageType: wageNegotiable ? "NEGOTIABLE" : "HOURLY",
    days,
    daysNegotiable,
    timeStart,
    timeEnd,
    timeNegotiable,
    regionCity,
    regionDistrict,
    addressDetail,
    description
  };

  // --------------------------------------------
  // 4) API 호출
  // --------------------------------------------
  try {
    await createOwnerJobPost(payload);
    alert("공고 등록 완료!");
    __goto?.("home");
  } catch (e) {
    console.error(e);
    alert("공고 등록 실패: " + (e?.message || e));
  }
}
