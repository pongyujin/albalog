// core/utils.js
// 공통 유틸(문자열/날짜/필터/서버매핑 등)

import { reviews, state } from "./state.js";

/* =======================
 * 문자열/보안 유틸
 * ======================= */
export function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function cryptoRandomId() {
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

/* =======================
 * 날짜/포맷 유틸
 * ======================= */
// 기존: MM/DD HH:MM
export function formatDateTime(iso) {
  const d = new Date(iso);
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

// 기존 myjobs 쪽: YYYY.MM.DD
export function formatDateYMD(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

// applicants/resume 등에서 쓰던: YYYY.MM.DD HH:MM
export function formatDateYMDHM(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

/* =======================
 * UI 유틸
 * ======================= */
export function makeEmpty(text) {
  const el = document.createElement("div");
  el.className = "empty";
  el.textContent = text;
  return el;
}

/* =======================
 * 리뷰/별점
 * ======================= */
export function avgStars(jobId) {
  const rs = reviews.filter((r) => r.jobId === jobId);
  if (rs.length === 0) return 4.3;
  return rs.reduce((a, b) => a + b.stars, 0) / rs.length;
}

/* =======================
 * 지역/필터링
 * ======================= */
export function splitRegion(regionStr) {
  // "광주 동구" -> {city:"광주", district:"동구"}
  // "부산 전체" -> {city:"부산", district:null}
  if (!regionStr) return { city: null, district: null };
  if (regionStr.endsWith("전체")) {
    const city = regionStr.split(" ")[0];
    return { city, district: null };
  }
  const [city, district] = regionStr.split(" ");
  return { city: city || null, district: district || null };
}

export function regionMatches(job, region) {
  if (!region) return true;
  if (region.endsWith("전체")) {
    const city = region.split(" ")[0];
    return String(job.region || "").startsWith(city);
  }
  return job.region === region;
}

export function getPayNumber(payStr) {
  const m = String(payStr || "").replaceAll(",", "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

export function applyFilters(list, extra = {}) {
  const q = String(state.query || "").trim().toLowerCase();

  return (list || []).filter((job) => {
    if (!regionMatches(job, state.region)) return false;
    if (state.category !== "전체" && job.category !== state.category) return false;

    if (extra.forceUrgent && !job.urgent) return false;
    if (extra.minPay && getPayNumber(job.pay) < extra.minPay) return false;

    if (!q) return true;
    const hay = `${job.title} ${job.company} ${job.category} ${job.region}`.toLowerCase();
    return hay.includes(q);
  });
}

/* =======================
 * 서버 공고 -> UI 공고 매핑
 * ======================= */
export function formatRegion(regionCity, regionDistrict) {
  return `${regionCity || ""} ${regionDistrict || ""}`.trim();
}

export function formatPay(wageType, wage) {
  if (wageType === "NEGOTIABLE" || wage == null) return "시급 협의";
  const num = Number(wage);
  return Number.isFinite(num) ? `시급 ${num.toLocaleString()}원` : "시급 정보없음";
}

export function formatTime(timeNegotiable, timeStart, timeEnd) {
  if (timeNegotiable) return "근무시간 협의";
  if (!timeStart || !timeEnd) return "근무시간 정보없음";
  return `${timeStart} ~ ${timeEnd}`;
}

export function mapServerPostToUiJob(p) {
  return {
    id: String(p.id),
    title: p.title ?? "",
    company: p.storeName ?? "",
    category: "전체",

    pay: formatPay(p.wageType, p.wage),
    time: formatTime(p.timeNegotiable, p.timeStart, p.timeEnd),
    region: formatRegion(p.regionCity, p.regionDistrict),

    desc: p.description ?? "",

    // 서버 필드명 케이스 대응
    imageUrl: p.imageUrl ?? p.image_url ?? p.imageURL ?? "",

    urgent: false,
    postedHoursAgo: 0
  };
}

/* =======================
 * 이력서/지원 관련 유틸
 * ======================= */
export function formatResumeUpdated(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", { year: "numeric", month: "short", day: "numeric" });
}

export function buildResumeSummaryHTML(r) {
  return `
    <div><b>희망 시급:</b> ${r?.desiredWage ? r.desiredWage + "원" : "협의"}</div>
    <div><b>가능 요일:</b> ${r?.days?.join(", ") || "요일 미입력"}</div>
    <div><b>가능 시간:</b> ${r?.timeStart || ""} ~ ${r?.timeEnd || ""}</div>
    <div><b>경력:</b> ${
      r?.experiences && r.experiences.length > 0
        ? r.experiences.map((e) => (e.storeName || "") + " (" + (e.roleText || "") + ")").join(", ")
        : "경력 없음"
    }</div>
    <div><b>보유 스킬:</b> ${r?.skills?.join(", ") || "없음"}</div>
  `;
}

// users/me 전화번호 표시용(너 코드 유지)
export function fmtPhone(phone) {
  let p = phone || "";
  if (p.length === 11) p = p.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  return p;
}
