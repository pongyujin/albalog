// /js/screens/myjobs.screen.js
// "내 지원내역(MyJobs)" 화면 렌더링 전담

import { $ } from "../core/dom.js";
import { formatDateYMD } from "../core/utils.js";
import { fetchMyApplications } from "../api/applications.api.js";

/**
 * ✅ 내 지원내역 화면 렌더
 * - 서버: GET /api/applications/my
 * - 응답 예(너 기존 main.js 기준):
 *   [
 *     {
 *       jobTitle, storeName, wage, wageType,
 *       regionCity, regionDistrict,
 *       appliedAt, readAt
 *     }
 *   ]
 */


/**
 * ✅ 날짜 안전 포맷
 * - null / undefined / invalid date 방어
 * - NaN.NaN.NaN 방지용
 */
function safeDateYMD(dateStr) {
  if (!dateStr) return "-";

  const d = new Date(dateStr);

  // Invalid Date 방어
  if (Number.isNaN(d.getTime())) return "-";

  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");

  return `${y}.${m}.${day}`;
}

export async function renderMyJobsScreen() {
  // ✅ 목록을 뿌릴 DOM(HTML에 id="myjobs-list" 있어야 함)
  const listEl = $("#myjobs-list");
  if (!listEl) {
    // DOM이 없으면 그냥 조용히 종료(에러 대신 구조 문제를 의심해야 함)
    console.warn("[myjobs] #myjobs-list 엘리먼트를 찾지 못했습니다. (HTML id 확인)");
    return;
  }

  // ✅ 로딩 상태 표시(사용자에게 '멈춤' 느낌 안 주기)
  listEl.innerHTML = "<div class='empty'>지원 내역을 불러오는 중...</div>";

  try {
    // ✅ API 호출
    const r = await fetchMyApplications(); // { ok, status, data, text }

    // ✅ 미로그인
    if (r.status === 401) {
      listEl.innerHTML = "<div class='empty'>로그인이 필요합니다.</div>";
      return;
    }

    // ✅ 기타 실패
    if (!r.ok) {
      console.error("[myjobs] fetchMyApplications 실패:", r.status, r.text);
      listEl.innerHTML = "<div class='empty'>불러오기에 실패했습니다.</div>";
      return;
    }

    // ✅ 정상 데이터
    const jobs = Array.isArray(r.data) ? r.data : [];

    // ✅ 지원 내역이 아예 없는 경우
    if (jobs.length === 0) {
      listEl.innerHTML = "<div class='empty'>아직 지원한 공고가 없습니다.</div>";
      return;
    }

    // ✅ 리스트 렌더링 (너가 main.js에서 쓰던 카드 마크업 거의 그대로)
    listEl.innerHTML = jobs
      .map((j) => {
        const wageNum = Number(j.wage ?? 0);
        const wageLabel =
          j.wageType === "HOURLY" ? "시" : (j.wageType === "DAILY" ? "일" : "건");

        // ✅ 열람 여부 뱃지
        const statusBadge = j.readAt
          ? `<div class="badge viewed">👀 사장님 열람함 (${formatDateYMD(j.readAt)})</div>`
          : `<div class="badge not-viewed">📭 아직 확인 안함</div>`;

		  return `
		    <div class="job-card myjob-card">
		      <div class="job-top myjob-top">
		        <div class="myjob-top-row">
		          <div class="job-title myjob-title">${j.jobTitle ?? ""}</div>
		          <div class="badge pay myjob-pay">
		            ${wageNum.toLocaleString()}원/${wageLabel}
		          </div>
		        </div>

		        <div class="job-company myjob-company">${j.storeName ?? ""}</div>
		      </div>

		      <div class="job-meta myjob-meta">
		        <div>${j.regionCity ?? ""} ${j.regionDistrict ?? ""}</div>
		        <div>${safeDateYMD(j.appliedAt)} 지원</div>
		      </div>

		      <div class="job-status myjob-status">
		        ${statusBadge}
		      </div>
		    </div>
		  `;

      })
      .join("");
  } catch (err) {
    // ✅ 네트워크/예외
    console.error("[myjobs] render 예외:", err);
    listEl.innerHTML = "<div class='empty'>오류가 발생했습니다. 콘솔을 확인해주세요.</div>";
  }
}
