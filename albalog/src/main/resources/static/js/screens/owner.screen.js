// /js/screens/owner.screen.js

import { $ , $$ } from "../core/dom.js";
import { state } from "../core/state.js";
import { fetchMyOwnerJobs } from "../api/jobs.api.js";

let __goto = null;

function buildOwnerJobCard(j) {
  return `
    <div class="job-card">
      <div class="job-top">
        <div>
          <div class="job-title">${j.title}</div>
          <div class="job-company">${j.storeName}</div>
        </div>
        <button class="btn small btn-view-applicants" data-job-id="${j.id}">
          지원자 보기
        </button>
      </div>
      <div class="job-meta">
        <span class="badge pay">${(j.wage ?? 0).toLocaleString()}원/${j.wageType}</span>
        <span class="badge">${j.regionCity} ${j.regionDistrict}</span>
      </div>
    </div>
  `;
}

export function initOwnerScreen({ goto }) {
  __goto = goto;

  // 상단 “공고 등록”
  $("#btn-owner-go-post")?.addEventListener("click", () => __goto?.("post"));
}
export async function renderOwnerScreen({ openApplicantsScreen } = {}) {
  try {
    // ✅ 로딩 표시
    Swal.fire({
      title: "불러오는 중...",
      text: "내 공고 목록을 가져오고 있습니다.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    const jobs = await fetchMyOwnerJobs();
    state.ownerJobs = jobs;

    // ✅ 로딩 닫기
    Swal.close();

    const list = $("#owner-job-list");
    if (!list) return;

    list.innerHTML = "";

    // =====================================================
    // 공고 없음
    // =====================================================
    if (jobs.length === 0) {
      list.innerHTML = `<div class="empty">등록된 공고가 없습니다.</div>`;
      return;
    }

    // =====================================================
    // 공고 렌더
    // =====================================================
    list.innerHTML = jobs.map((j) => buildOwnerJobCard(j)).join("");

    // 각 공고의 "지원자 보기" 버튼 연결
    $$(".btn-view-applicants").forEach((btn) => {
      btn.onclick = () => openApplicantsScreen?.(btn.dataset.jobId);
    });

    // =====================================================
    // (옵션) 상단 "지원자 확인" 버튼
    // =====================================================
    $("#btn-owner-go-applicants") &&
      ($("#btn-owner-go-applicants").onclick = async () => {
        const first = state.ownerJobs?.[0];

        if (!first) {
          await Swal.fire({
            icon: "info",
            title: "공고 없음",
            text: "불러온 공고가 없습니다.",
            confirmButtonText: "확인"
          });
          return;
        }

        await openApplicantsScreen?.(first.id);
      });

  } catch (err) {
    console.error(err);

    // 로딩이 떠있을 수 있으니 닫기
    Swal.close();

    await Swal.fire({
      icon: "error",
      title: "불러오기 실패",
      text: "공고 목록을 불러오는 중 오류가 발생했습니다.",
      confirmButtonText: "확인"
    });
  }
}
