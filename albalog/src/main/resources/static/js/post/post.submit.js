// /js/post/post.submit.js
// 공고 등록 submit(검증 + API 호출) 전담

import { $, $$ } from "../core/dom.js";
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
 * ✅ 필수 입력 경고 모달 (alert 대체)
 */
async function warnRequired(text) {
  await Swal.fire({
    icon: "warning",
    title: "입력 확인",
    text,
    confirmButtonText: "확인"
  });
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
  // 2) 필수 검증(기존 로직 유지) - alert -> Swal
  // --------------------------------------------
  if (!storeName || !title || !regionCity || !regionDistrict) {
    await warnRequired("가게이름/공고제목/근무지역(시·구)은 필수입니다.");
    return;
  }

  if (!wageNegotiable && (!wage || wage <= 0)) {
    await warnRequired("시급 금액을 입력하거나 '협의'를 선택해주세요.");
    return;
  }

  if (!daysNegotiable && days.length === 0) {
    await warnRequired("근무요일을 선택하거나 '협의'를 선택해주세요.");
    return;
  }

  if (!timeNegotiable && (!timeStart || !timeEnd)) {
    await warnRequired("근무시간을 입력하거나 '협의'를 선택해주세요.");
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
  // 4) API 호출 - alert -> Swal + 로딩
  // --------------------------------------------
  try {
    // ✅ 로딩
    Swal.fire({
      title: "등록 중...",
      text: "공고를 등록하고 있습니다.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    await createOwnerJobPost(payload);

    // ✅ 로딩 닫기
    Swal.close();

    // ✅ 성공
    await Swal.fire({
      icon: "success",
      title: "등록 완료",
      text: "공고 등록이 완료되었습니다.",
      confirmButtonText: "확인"
    });

    __goto?.("home");
  } catch (e) {
    console.error(e);

    // 로딩 떠있을 수 있으니 닫기
    Swal.close();

    // ✅ 실패
    await Swal.fire({
      icon: "error",
      title: "등록 실패",
      text: "공고 등록에 실패했습니다. 잠시 후 다시 시도해주세요.",
      confirmButtonText: "확인"
    });
  }
}
