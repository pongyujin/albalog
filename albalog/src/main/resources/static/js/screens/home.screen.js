// /js/screens/home.screen.js

import { $, $$ } from "../core/dom.js";
import { store } from "../core/store.js";
import { state } from "../core/state.js";
import {
  makeEmpty,
  escapeHtml,
  applyFilters,
  avgStars,
  splitRegion,
  mapServerPostToUiJob
} from "../core/utils.js";
import { fetchJobPosts } from "../api/jobs.api.js";

let __goto = null;
let __homeBound = false;
let __homeRenderToken = 0;

function syncRegionUI() {
  const pill = $("#region-pill-text");
  const current = $("#current-region-text");
  if (!pill || !current) return;

  pill.textContent = state.region.includes("광주 ")
    ? state.region.replace("광주 ", "")
    : state.region;

  current.textContent = state.region.includes("전체")
    ? state.region
    : state.region.split(" ")[0] + " 전체";
}

function makeJobCard(job) {
  const el = document.createElement("div");
  el.className = "job-card";
  el.innerHTML = `
    <div class="job-top">
      <div>
        <div class="job-title">${escapeHtml(job.title)}</div>
        <div class="job-company">${escapeHtml(job.company)}</div>
      </div>
      ${job.urgent ? `<div class="badge urgent">급구</div>` : ""}
    </div>
    <div class="job-meta">
      <div class="badge pay">${escapeHtml(job.pay)}</div>
      <div class="badge">${escapeHtml(job.time)}</div>
      <div class="badge">${escapeHtml(job.region)}</div>
      <div class="badge star">⭐ ${avgStars(job.id).toFixed(1)}</div>
    </div>
  `;
  el.addEventListener("click", () => {
    state.selectedJobId = job.id;
    __goto?.("detail");
  });
  return el;
}

async function loadHomePostsFromServer() {
  const { city, district } = splitRegion(state.region);
  const posts = await fetchJobPosts({ regionCity: city, regionDistrict: district });
  state.jobs = posts.map(mapServerPostToUiJob);
}

export function initHomeScreen({ goto }) {
  __goto = goto;
  if (__homeBound) return;
  __homeBound = true;

  // Region sheet
  const regionBackdrop = $("#region-sheet-backdrop");
  $("#btn-open-region")?.addEventListener("click", () => regionBackdrop?.classList.add("show"));
  $("#btn-close-region")?.addEventListener("click", () => regionBackdrop?.classList.remove("show"));
  regionBackdrop?.addEventListener("click", (e) => {
    if (e.target === regionBackdrop) regionBackdrop.classList.remove("show");
  });

  $$(".region-chip").forEach((btn) => {
    btn.addEventListener("click", () => {
      state.region = btn.dataset.region;
      store.set("mg_region", state.region);
      syncRegionUI();
      regionBackdrop?.classList.remove("show");
      renderHomeScreen();
    });
  });

  $("#btn-scroll-top")?.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });

  // Search
  $("#search-input")?.addEventListener("input", (e) => {
    state.query = e.target.value;
    renderHomeScreen();
  });

  // Category chips
  $("#category-chips")?.addEventListener("click", (e) => {
    const chip = e.target.closest(".chip");
    if (!chip) return;
    state.category = chip.dataset.category;
    $$(".chip").forEach((c) => c.classList.toggle("active", c === chip));
    renderHomeScreen();
  });

  // Banner slider
  const slider = $(".slider-banner");
  function setBanner(index) {
    state.currentBanner = index % 2;
    if (slider) slider.style.transform = `translateX(${-state.currentBanner * 50}%)`;
  }
  setInterval(() => setBanner(state.currentBanner + 1), 4500);

  $$(".banner-slide").forEach((slide) => {
    slide.addEventListener("click", () => {
      state.query = "";
      const si = $("#search-input");
      if (si) si.value = "";

      state.category = "전체";
      $$(".chip").forEach((c) => c.classList.toggle("active", c.dataset.category === "전체"));

      if (slide.dataset.banner === "urgent") {
        renderHomeScreen({ forceUrgent: true });
      } else {
        renderHomeScreen({ minPay: 11000 });
      }
    });
  });
}

export async function renderHomeScreen(extraFilters = {}) {
  const token = ++__homeRenderToken;

  syncRegionUI();

  const urgentList = $("#urgent-list");
  const jobList = $("#job-list");
  if (!jobList) return;

  if (urgentList) urgentList.innerHTML = "";
  jobList.innerHTML = "";

  try {
    await loadHomePostsFromServer();
  } catch (e) {
    if (token !== __homeRenderToken) return;
    console.error(e);
    jobList.appendChild(makeEmpty("서버에서 공고를 불러오지 못했어 😭 (콘솔 확인)"));
    return;
  }

  if (token !== __homeRenderToken) return;

  if (urgentList) {
    const urgentFiltered = applyFilters(state.jobs.filter((j) => j.urgent), extraFilters);
    if (urgentFiltered.length === 0) {
      urgentList.appendChild(makeEmpty("해당 조건의 급구 공고가 없어요. 지역/카테고리를 바꿔보자!"));
    } else {
      urgentFiltered.slice(0, 4).forEach((job) => urgentList.appendChild(makeJobCard(job)));
    }
  }

  const allFiltered = applyFilters(state.jobs, extraFilters);
  if (allFiltered.length === 0) {
    jobList.appendChild(makeEmpty("검색 결과가 없어요. 키워드를 바꾸거나 지역을 바꿔봐!"));
  } else {
    allFiltered.forEach((job) => jobList.appendChild(makeJobCard(job)));
  }
}
