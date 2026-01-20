// /js/screens/myjobs.screen.js
// 지원내역 화면 + 받은 후기 섹션 렌더
// - 상단: 사장님 후기(#review-list)
// - 하단: 지원내역(#myjobs-list)

import { $ } from "../core/dom.js";
import { formatDateYMD } from "../core/utils.js"; // ✅ 이것만 사용
import { getMe } from "../api/users.api.js";
import { fetchMyApplications } from "../api/applications.api.js";
import { getReviewsByWorker } from "../api/reviews.api.js";
import { openChatScreen } from "./chat.screen.js";


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
// ✅ 후기 카드 생성 (가게명 + 단계 라벨 표시)
// ======================================================
function buildReviewCard(r) {
  // -------------------------------
  // 1) 별점 표시(1자리 고정)
  // -------------------------------
  const ratingNum = Number(r?.rating);
  const ratingText = Number.isFinite(ratingNum)
    ? ratingNum.toFixed(1)
    : String(r?.rating ?? "-");

  // -------------------------------
  // 2) 코멘트/작성일
  // -------------------------------
  const comment = (r?.comment ?? "").trim();
  const created = formatDateYMD(r?.createdAt);

  // -------------------------------
  // 3) 가게명 + "사장님 후기"
  // - 백엔드에서 ReviewResponse에 storeName 내려주도록 했을 때 사용
  // - 없으면 기본 문구로 fallback
  // -------------------------------
  const storeName = (r?.storeName ?? "").trim();
  const title = storeName ? `${escapeHtml(storeName)} 사장님 후기` : "사장님 후기";

  // -------------------------------
  // 4) phase 라벨(선택)
  // -------------------------------
  const phase = String(r?.phase ?? "").trim();
  const phaseLabel =
    phase === "INITIAL" ? "채용 직후 후기" :
    phase === "MONTH_1" ? "1개월 후기" :
    phase === "MONTH_3" ? "3개월 후기" :
    "";

  return `
    <div class="review-card">
      <div class="review-top">
        <div class="review-name">${title}</div>
        <div class="badge star">⭐ ${ratingText}</div>
      </div>

      ${phaseLabel ? `<div class="review-text">${escapeHtml(phaseLabel)}</div>` : ""}

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
// ✅ 지원내역 카드 생성 (시급 자리 = 상태/메시지로 대체)
// ======================================================
function buildMyJobCard(j) {

  // -------------------------------
  // 0) 데이터 정리
  // -----------------
  const appliedAt = formatDateYMD(j?.createdAt);

  const readAt = j?.readAt ? formatDateYMD(j.readAt) : null;


  const status = String(j?.status ?? "PENDING").toUpperCase();

  const applicationId = j?.applicationId ?? j?.id ?? "";


  // -------------------------------
  // 1) "시급 배지 자리"에 들어갈 UI 만들기
  // -------------------------------
  // - PENDING이면 기존처럼 시급 보여줘도 되는데,
  //   너는 채용/거절만 강조하자고 했으니 PENDING은 시급 유지(원하면 빈칸 처리도 가능)
  const wageNum = Number(j?.wage ?? 0);
  const wageLabel = j?.wageType === "HOURLY" ? "시" : (j?.wageType || "");
  const wageUi = `
    <div class="badge pay myjob-pay">
      ${wageNum.toLocaleString()}원/${escapeHtml(wageLabel)}
    </div>
  `;

  // ✅ 채용/거절 UI를 pay 자리로 올림
  const statusPayUi =
    status === "ACCEPTED"
      ? `
        <div class="myjob-pay-actions">
          <div class="hire-label">✅ 채용됨</div>
          <button
            class="btn message btn-myjob-message"
            data-application-id="${escapeHtml(applicationId)}"
          >메시지</button>
        </div>
      `
      : status === "REJECTED"
        ? `
          <div class="myjob-pay-actions">
            <div class="reject-label">거절됨</div>
          </div>
        `
        : wageUi; // ✅ PENDING은 일단 시급 유지 (원하면 ""로 바꿀 수 있음)

  // -------------------------------
  // 2) 카드 HTML
  // -------------------------------
  return `
    <div class="job-card ${status === "ACCEPTED" ? "accepted" : status === "REJECTED" ? "rejected" : "pending"}">
      <div class="job-top myjob-top">
        <div class="myjob-top-row">
          <div class="job-title myjob-title">
            ${escapeHtml(j?.jobTitle ?? "")}
          </div>

          <!-- ✅ 여기(시급 배지 자리)가 상태/메시지 자리로 변경됨 -->
          ${statusPayUi}
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
  // ------------------------------------------------------
  // 0) (이벤트) 메시지 버튼 클릭 처리 (이벤트 위임)
  // - render할 때마다 바인딩되지 않게 dataset.bound로 1회만
  // ------------------------------------------------------
  const listElForBind = $("#myjobs-list");
  if (listElForBind && listElForBind.dataset.bound !== "1") {
    listElForBind.dataset.bound = "1";
	
	
	listElForBind.addEventListener("click", async (e) => {
	  const btn = e.target.closest(".btn-myjob-message");
	  if (!btn) return;

	  e.preventDefault();
	  e.stopPropagation();

	  const appId = btn.dataset.applicationId;

	  // ✅ applicationId가 비어있으면 방어
	  if (!appId) {
	    await Swal.fire({
	      icon: "error",
	      title: "오류",
	      text: "applicationId를 찾을 수 없습니다.",
	      confirmButtonText: "확인"
	    });
	    return;
	  }

	  // ✅ 채팅 화면 이동
	  openChatScreen({
	    applicationId: Number(appId),
	    backTo: "myjobs"
	  });
	});

  }

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
