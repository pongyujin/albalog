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
    const jobs = await fetchMyOwnerJobs();
    state.ownerJobs = jobs;

    const list = $("#owner-job-list");
    if (!list) return;
    list.innerHTML = "";

    if (jobs.length === 0) {
      list.innerHTML = `<div class="empty">등록된 공고가 없습니다.</div>`;
      return;
    }

    list.innerHTML = jobs.map((j) => buildOwnerJobCard(j)).join("");

    $$(".btn-view-applicants").forEach((btn) => {
      btn.onclick = () => openApplicantsScreen?.(btn.dataset.jobId);
    });

    // (옵션) “지원자 확인” 같은 버튼이 따로 있으면 첫 공고로 연결
    $("#btn-owner-go-applicants") &&
      ($("#btn-owner-go-applicants").onclick = async () => {
        const first = state.ownerJobs?.[0];
        if (!first) return alert("불러온 공고가 없습니다.");
        await openApplicantsScreen?.(first.id);
      });

  } catch (err) {
    console.error(err);
    alert("공고 목록을 불러오는 중 오류가 발생했습니다.");
  }
}
