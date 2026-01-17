// /js/screens/detail.screen.js

import { $ } from "../core/dom.js";
import { state, reviews } from "../core/state.js";
import { makeEmpty, avgStars } from "../core/utils.js";
import { fetchJobPosts } from "../api/jobs.api.js";
import { splitRegion, mapServerPostToUiJob } from "../core/utils.js";
import { getMe } from "../api/users.api.js";


let __goto = null;

function makeReviewCard(r) {
  const el = document.createElement("div");
  el.className = "review-card";
  el.innerHTML = `
    <div class="review-top">
      <div class="review-name">${r.name}</div>
      <div class="badge star">⭐ ${r.stars}</div>
    </div>
    <div class="review-text">${r.text}</div>
  `;
  return el;
}

async function ensureJobsLoaded() {
  if (Array.isArray(state.jobs) && state.jobs.length > 0) return;

  const { city, district } = splitRegion(state.region);
  const posts = await fetchJobPosts({ regionCity: city, regionDistrict: district });
  state.jobs = posts.map(mapServerPostToUiJob);
}

export function initDetailScreen({ goto }) {
  __goto = goto;

  // ✅ [중요] "이 공고에 지원하기" 버튼 클릭
  const applyBtn = document.querySelector("#btn-apply");
  if (!applyBtn) return;

  // 중복 바인딩 방지
  if (applyBtn.dataset.bound === "1") return;
  applyBtn.dataset.bound = "1";

  applyBtn.addEventListener("click", async () => {
    try {
      // 세션 기준 로그인 여부 확인
      const r = await getMe();

      if (!r.ok) {
        alert("지원하려면 로그인해야 해!");
        __goto("login");
        return;
      }

      // 로그인 상태 → 지원 화면으로
      __goto("apply");
    } catch (e) {
      console.error(e);
      alert("로그인 상태를 확인할 수 없습니다.");
    }
  });
}


export async function renderDetailScreen() {
  const id = state.selectedJobId;
  if (!id) {
    __goto?.("home");
    return;
  }

  try {
    await ensureJobsLoaded();
  } catch (e) {
    console.error(e);
    alert("공고 정보를 불러오지 못했습니다.");
    __goto?.("home");
    return;
  }

  const job = state.jobs.find((j) => String(j.id) === String(id));
  if (!job) {
    __goto?.("home");
    return;
  }

  const titleEl = $("#detail-title");
  const companyEl = $("#detail-company");
  const payEl = $("#detail-pay");
  const timeEl = $("#detail-time");
  const regionEl = $("#detail-region");
  const descEl = $("#detail-desc");

  if (!titleEl || !companyEl || !payEl || !timeEl || !regionEl || !descEl) return;

  titleEl.textContent = job.title || "";
  companyEl.textContent = job.company || "";
  payEl.textContent = job.pay || "";
  timeEl.textContent = `🕒 ${job.time || ""}`;
  regionEl.textContent = `📍 ${job.region || ""}`;
  descEl.textContent = job.desc || "상세 설명 준비중";

  const list = $("#detail-review-list");
  const info = $("#detail-review-info");
  if (!list || !info) return;

  list.innerHTML = "";

  const rs = (Array.isArray(reviews) ? reviews : []).filter((r) => String(r.jobId) === String(job.id));
  info.textContent = `평점 ⭐ ${avgStars(job.id).toFixed(1)} · 후기 ${rs.length}개`;

  if (rs.length === 0) {
    list.appendChild(makeEmpty("아직 후기가 없어요. 첫 후기를 남겨보세요! (데모)"));
  } else {
    rs.forEach((r) => list.appendChild(makeReviewCard(r)));
  }
}
