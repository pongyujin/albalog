// /js/screens/myjobs.screen.js
// 지원내역 화면 + 받은 후기 섹션 렌더
// - 상단: 사장님 후기(#review-list)
// - 하단: 지원내역(#myjobs-list)

import { $, $$ } from "../core/dom.js";
import { formatDateYMD } from "../core/utils.js"; // ✅ 이것만 사용
import { getMe } from "../api/users.api.js";
import { fetchMyApplications } from "../api/applications.api.js";
import { getReviewsByWorker } from "../api/reviews.api.js";

// ======================================================
// ✅ HTML escape (XSS 방지)
// ======================================================
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

// ======================================================
// ✅ 후기 카드 생성
// ======================================================
function buildReviewCard(r) {
  const ratingNum = Number(r?.rating);
  const ratingText = Number.isFinite(ratingNum)
    ? ratingNum.toFixed(1)
    : String(r?.rating ?? "-");

  const comment = (r?.comment ?? "").trim();
  const created = formatDateYMD(r?.createdAt);

  return `
    <div class="review-card">
      <div class="review-top">
        <div class="review-name">사장님 후기</div>
        <div class="badge star">⭐ ${ratingText}</div>
      </div>
      <div class="review-text">${escapeHtml(comment || "코멘트 없음")}</div>
      <div class="msg-meta">${created}</div>
    </div>
  `;
}

// ======================================================
// ✅ 후기 섹션 렌더
// ======================================================
async function renderMyReviewsSection() {
  const wrap = $("#review-list");
  if (!wrap) return;

  wrap.innerHTML = `<p class="empty">후기를 불러오는 중...</p>`;

  // 1) 내 정보 조회
  const meRes = await getMe();
  if (!meRes.ok) {
    wrap.innerHTML = `<p class="empty">로그인 후 후기를 확인할 수 있습니다.</p>`;
    return;
  }

  const workerId = meRes.data?.id;
  if (!workerId) {
    wrap.innerHTML = `<p class="empty">사용자 정보를 확인할 수 없습니다.</p>`;
    return;
  }

  // 2) 후기 목록 조회
  const r = await getReviewsByWorker(workerId);
  if (!r.ok) {
    wrap.innerHTML = `<p class="empty">후기를 불러오지 못했습니다.</p>`;
    return;
  }

  const list = Array.isArray(r.data) ? r.data : [];
  if (list.length === 0) {
    wrap.innerHTML = `<p class="empty">아직 후기가 없습니다.</p>`;
    return;
  }

  wrap.innerHTML = list.map(buildReviewCard).join("");
}

// ======================================================
// ✅ 지원내역 카드 생성
// ======================================================
function buildMyJobCard(j) {
  const wageNum = Number(j?.wage ?? 0);
  const wageLabel = j?.wageType === "HOURLY" ? "시" : (j?.wageType || "");

  const appliedAt = formatDateYMD(j?.appliedAt);
  const readAt = j?.readAt ? formatDateYMD(j.readAt) : null;

  return `
    <div class="job-card">
      <div class="job-top myjob-top">
        <div class="myjob-top-row">
          <div class="job-title myjob-title">
            ${escapeHtml(j?.jobTitle ?? "")}
          </div>
          <div class="badge pay myjob-pay">
            ${wageNum.toLocaleString()}원/${escapeHtml(wageLabel)}
          </div>
        </div>

        <div class="job-company myjob-company">
          ${escapeHtml(j?.storeName ?? "")}
        </div>
      </div>

      <div class="job-meta myjob-meta">
        <div>
          ${escapeHtml((j?.regionCity ?? "") + " " + (j?.regionDistrict ?? ""))}
        </div>
        <div>${appliedAt} 지원</div>
      </div>

      <div class="job-status">
        ${
          readAt
            ? `<div class="badge viewed">👀 사장님 열람함 (${readAt})</div>`
            : `<div class="badge not-viewed">📭 아직 확인 안함</div>`
        }
      </div>
    </div>
  `;
}

// ======================================================
// ✅ 메인 렌더 함수
// ======================================================
export async function renderMyJobsScreen() {
  // 1) 후기 섹션
  try {
    await renderMyReviewsSection();
  } catch (e) {
    console.error("[myjobs] reviews render error:", e);
    $("#review-list") &&
      ($("#review-list").innerHTML = `<p class="empty">후기 로딩 중 오류가 발생했습니다.</p>`);
  }

  // 2) 지원내역
  const listEl = $("#myjobs-list");
  if (!listEl) return;

  listEl.innerHTML = `<div class="empty">지원 내역을 불러오는 중...</div>`;

  try {
    const apps = await fetchMyApplications();
    const jobs = Array.isArray(apps) ? apps : (apps?.data ?? []);

    if (!jobs || jobs.length === 0) {
      listEl.innerHTML = `<div class="empty">아직 지원한 공고가 없습니다.</div>`;
      return;
    }

    listEl.innerHTML = jobs.map(buildMyJobCard).join("");
  } catch (e) {
    console.error("[myjobs] list render error:", e);
    listEl.innerHTML = `<div class="empty">지원 내역을 불러오지 못했습니다.</div>`;
  }
}
