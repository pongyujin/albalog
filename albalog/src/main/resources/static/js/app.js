/**
 * 믿GO알바 - Demo App (Vanilla JS)
 * ✅ 최종 정리 버전
 * - SPA navigation
 * - Region/category/search filtering
 * - Home list: DB API (/api/job-posts) 연동
 * - Post form: 예전 initPostUI()로 복구 (시간 선택 정상)
 * - Auth: 세션 없는 상태에서도 알바생 네비가 보이도록 예전 로직 유지
 */

console.log("✅ main.js loaded");

// ======================================================
// 0) DOM Helpers
// ======================================================
const $ = (sel, root = document) => root.querySelector(sel);
const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));

// ======================================================
// 1) localStorage Helpers (데모용 저장소)
// ======================================================
const store = {
  get(key, fallback) {
    try {
      const v = localStorage.getItem(key);
      return v ? JSON.parse(v) : fallback;
    } catch {
      return fallback;
    }
  },
  set(key, value) {
    localStorage.setItem(key, JSON.stringify(value));
  },
  del(key) {
    localStorage.removeItem(key);
  }
};

// ======================================================
// 2) Demo Reviews (별점 계산용)
// ======================================================
const reviews = [
  { id:"r1", jobId:"j1", name:"익명", stars:5, text:"사장님이 친절하고 근무 동선이 깔끔해요. 바쁜 시간대에도 팀워크 좋아서 금방 적응했습니다." },
  { id:"r2", jobId:"j1", name:"라떼러버", stars:4, text:"레시피가 정리돼있어서 초보도 따라가기 괜찮았어요. 다만 피크 타임은 정신없음!" },
  { id:"r3", jobId:"j2", name:"밤샘고수", stars:4, text:"야간은 손님 적을 땐 편한데, 진열/청소가 몰리면 바빠요. 그래도 급여는 제때." },
  { id:"r4", jobId:"j4", name:"주말알바", stars:5, text:"서빙 동선 좋고, 사장님이 팁도 챙겨주셔서 만족했어요." },
  { id:"r5", jobId:"j6", name:"마감장인", stars:4, text:"마감 루틴이 체계적이라 좋습니다. 늦게 끝나도 택시비 지원은 아니라서 참고!" }
];

// ======================================================
// 3) App State
// ======================================================
const state = {
  category: "전체",
  region: store.get("mg_region", "광주 동구"),
  query: "",
  currentBanner: 0,
  selectedJobId: null,

  // ✅ 홈 렌더에서 서버 공고를 여기에 저장
  jobs: []
};

state.reviewTargetAppId = null;


// ======================================================
// 4) Screens DOM refs
// ======================================================
const screens = {
  home: $("#screen-home"),
  login: $("#screen-login"),
  signup: $("#screen-signup"),
  detail: $("#screen-detail"),
  apply: $("#screen-apply"),
  post: $("#screen-post"),
  resume: $("#screen-resume"),
  profile: $("#screen-profile"),
  messages: $("#screen-messages"),
  myjobs: $("#screen-myjobs"),
  reviews: $("#screen-reviews"),
  owner: $("#screen-owner"),
  applicants: $("#screen-applicants"),
  // ✅ 추가
  reviewWrite: $("#screen-review-write")
};

const slider = $(".slider-banner");

// ======================================================
// 5) Common Utils
// ======================================================
function escapeHtml(str){
  return String(str)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}

function cryptoRandomId(){
  return Math.random().toString(16).slice(2) + Date.now().toString(16);
}

function formatDate(iso){
  const d = new Date(iso);
  const mm = String(d.getMonth()+1).padStart(2,"0");
  const dd = String(d.getDate()).padStart(2,"0");
  const hh = String(d.getHours()).padStart(2,"0");
  const mi = String(d.getMinutes()).padStart(2,"0");
  return `${mm}/${dd} ${hh}:${mi}`;
}

function makeEmpty(text){
  const el = document.createElement("div");
  el.className = "empty";
  el.textContent = text;
  return el;
}

function avgStars(jobId){
  const rs = reviews.filter(r => r.jobId === jobId);
  if (rs.length === 0) return 4.3;
  return rs.reduce((a,b)=>a+b.stars,0)/rs.length;
}

// ======================================================
// 6) API: Home list fetch
// ======================================================
function splitRegion(regionStr){
  // "광주 동구" -> {city:"광주", district:"동구"}
  // "부산 전체" -> {city:"부산", district:null}
  if (!regionStr) return { city:null, district:null };
  if (regionStr.endsWith("전체")){
    const city = regionStr.split(" ")[0];
    return { city, district: null };
  }
  const [city, district] = regionStr.split(" ");
  return { city: city || null, district: district || null };
}

async function fetchJobPosts(){
  const { city, district } = splitRegion(state.region);
  const params = new URLSearchParams();
  if (city) params.set("regionCity", city);
  if (district) params.set("regionDistrict", district);

  const res = await fetch("/api/job-posts?" + params.toString(), {
    credentials: "include"
  });
  if (!res.ok) throw new Error("공고 조회 실패: " + res.status);
  return await res.json();
}

// 서버 JSON -> UI 카드용 job 변환
function formatRegion(regionCity, regionDistrict) {
  return `${regionCity || ""} ${regionDistrict || ""}`.trim();
}
function formatPay(wageType, wage) {
  if (wageType === "NEGOTIABLE" || wage == null) return "시급 협의";
  const num = Number(wage);
  return Number.isFinite(num) ? `시급 ${num.toLocaleString()}원` : "시급 정보없음";
}
function formatTime(timeNegotiable, timeStart, timeEnd) {
  if (timeNegotiable) return "근무시간 협의";
  if (!timeStart || !timeEnd) return "근무시간 정보없음";
  return `${timeStart} ~ ${timeEnd}`;
}

// 공고 
function mapServerPostToUiJob(p){
  return {
    id: String(p.id),
    title: p.title ?? "",
    company: p.storeName ?? "",
    category: "전체",

    pay: formatPay(p.wageType, p.wage),
    time: formatTime(p.timeNegotiable, p.timeStart, p.timeEnd),
    region: formatRegion(p.regionCity, p.regionDistrict),

    // ✅ 여기 추가
    desc: p.description ?? "",

    // ✅ 이미지(서버 필드명이 imageUrl일 수도 있고 image_url일 수도 있어서 둘 다 대응)
    imageUrl: p.imageUrl ?? p.image_url ?? p.imageURL ?? "",

    urgent: false,
    postedHoursAgo: 0
  };
}


// ======================================================
// 7) Region UI
// ======================================================
const regionBackdrop = $("#region-sheet-backdrop");

function syncRegionUI(){
  const pill = $("#region-pill-text");
  const current = $("#current-region-text");
  if (!pill || !current) return;

  pill.textContent = state.region.includes("광주 ") ? state.region.replace("광주 ","") : state.region;
  current.textContent = state.region.includes("전체")
    ? state.region
    : state.region.split(" ")[0] + " 전체";
}

$("#btn-open-region")?.addEventListener("click", () => regionBackdrop?.classList.add("show"));
$("#btn-close-region")?.addEventListener("click", () => regionBackdrop?.classList.remove("show"));
regionBackdrop?.addEventListener("click", (e) => {
  if (e.target === regionBackdrop) regionBackdrop.classList.remove("show");
});

$$(".region-chip").forEach(btn => {
  btn.addEventListener("click", () => {
    state.region = btn.dataset.region;
    store.set("mg_region", state.region);
    syncRegionUI();
    regionBackdrop?.classList.remove("show");
    renderHome();
  });
});

$("#btn-scroll-top")?.addEventListener("click", () => window.scrollTo({top:0, behavior:"smooth"}));

// ======================================================
// 8) Filtering (기존 로직 유지)
// ======================================================
function regionMatches(job, region){
  if (!region) return true;
  if (region.endsWith("전체")){
    const city = region.split(" ")[0];
    return job.region.startsWith(city);
  }
  return job.region === region;
}

function getPayNumber(payStr){
  const m = payStr.replaceAll(",", "").match(/(\d+)/);
  return m ? Number(m[1]) : 0;
}

function applyFilters(list, opts={}){
  const q = state.query.trim().toLowerCase();
  return list.filter(job => {
    if (!regionMatches(job, state.region)) return false;
    if (state.category !== "전체" && job.category !== state.category) return false;

    if (opts.forceUrgent && !job.urgent) return false;
    if (opts.minPay && getPayNumber(job.pay) < opts.minPay) return false;

    if (!q) return true;
    const hay = `${job.title} ${job.company} ${job.category} ${job.region}`.toLowerCase();
    return hay.includes(q);
  });
}
state.resumeMode = "ME"; // "ME" | "APPLICANT"
// ======================================================
// 9) Card builders
// ======================================================
function makeJobCard(job){
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
    goto("detail");
  });
  return el;
}

function makeReviewCard(r){
  const el = document.createElement("div");
  el.className = "review-card";
  el.innerHTML = `
    <div class="review-top">
      <div class="review-name">${escapeHtml(r.name)}</div>
      <div class="badge star">⭐ ${r.stars}</div>
    </div>
    <div class="review-text">${escapeHtml(r.text)}</div>
  `;
  return el;
}

function makeMsgCard(m){
  const el = document.createElement("div");
  el.className = "msg-card";
  el.innerHTML = `
    <div class="msg-title">${escapeHtml(m.title)}</div>
    <div class="msg-text">${escapeHtml(m.text)}</div>
    <div class="msg-meta">${formatDate(m.at)}</div>
  `;
  return el;
}  // 토큰;
  let homeRenderToken = 0;

  // ======================================================
  // 10) Home Render (서버 공고 fetch)
  // ======================================================
  async function renderHome(extraFilters = {}) {
	console.count("renderHome called");

    const token = ++homeRenderToken; // 이번 호출 고유 토큰

    syncRegionUI();

    const urgentList = $("#urgent-list");
    const jobList = $("#job-list");
    if (!jobList) return;

    // 일단 화면 비우기 (이번 토큰 기준)
    if (urgentList) urgentList.innerHTML = "";
    jobList.innerHTML = "";

    let posts;
    try {
      posts = await fetchJobPosts();
    } catch (e) {
      // ✅ fetch 끝났는데 이미 다른 renderHome이 시작됐으면(토큰 변경) 아무 것도 하지 말고 종료
      if (token !== homeRenderToken) return;

      console.error(e);
      jobList.appendChild(makeEmpty("서버에서 공고를 불러오지 못했어 😭 (콘솔 확인)"));
      return;
    }

    // ✅ fetch 끝났는데 이미 다른 renderHome이 시작됐으면(토큰 변경) 렌더 금지
    if (token !== homeRenderToken) return;

    state.jobs = posts.map(mapServerPostToUiJob);

    // 급구 영역(있으면만)
    if (urgentList) {
      const urgentFiltered = applyFilters(state.jobs.filter(j => j.urgent), extraFilters);
      if (urgentFiltered.length === 0) {
        urgentList.appendChild(makeEmpty("해당 조건의 급구 공고가 없어요. 지역/카테고리를 바꿔보자!"));
      } else {
        urgentFiltered.slice(0, 4).forEach(job => urgentList.appendChild(makeJobCard(job)));
      }
    }

    const allFiltered = applyFilters(state.jobs, extraFilters);
    if (allFiltered.length === 0) {
      jobList.appendChild(makeEmpty("검색 결과가 없어요. 키워드를 바꾸거나 지역을 바꿔봐!"));
    } else {
      allFiltered.forEach(job => jobList.appendChild(makeJobCard(job)));
    }
  }


// ======================================================
// 11) Detail / Apply / MyJobs / Messages / Reviews
// ======================================================
async function renderDetail(){
  const id = state.selectedJobId;

  // 선택된 공고가 없으면 홈으로
  if (!id) {
    goto("home");
    return;
  }

  // jobs가 비어있으면(초기/새로고침/직접 진입 등) 서버에서 다시 가져오기
  if (!Array.isArray(state.jobs) || state.jobs.length === 0) {
    try {
      const posts = await fetchJobPosts();
      state.jobs = posts.map(mapServerPostToUiJob);
    } catch (e) {
      console.error(e);
      alert("공고 정보를 불러오지 못했습니다.");
      goto("home");
      return;
    }
  }

  const job = state.jobs.find(j => String(j.id) === String(id));
  if (!job) {
    goto("home");
    return;
  }

  // DOM이 없으면(화면 구조 변경/로딩 타이밍 문제) 그냥 종료
  const titleEl   = $("#detail-title");
  const companyEl = $("#detail-company");
  const payEl     = $("#detail-pay");
  const timeEl    = $("#detail-time");
  const regionEl  = $("#detail-region");
  const descEl    = $("#detail-desc");

  if (!titleEl || !companyEl || !payEl || !timeEl || !regionEl || !descEl) return;

  titleEl.textContent   = job.title || "";
  companyEl.textContent = job.company || "";
  payEl.textContent     = job.pay || "";
  timeEl.textContent    = `🕒 ${job.time || ""}`;
  regionEl.textContent  = `📍 ${job.region || ""}`;
  descEl.textContent    = job.desc || "상세 설명 준비중";

  const list = $("#detail-review-list");
  const info = $("#detail-review-info");
  if (!list || !info) return;

  list.innerHTML = "";

  const rs = (Array.isArray(reviews) ? reviews : []).filter(r => String(r.jobId) === String(job.id));
  info.textContent = `평점 ⭐ ${avgStars(job.id).toFixed(1)} · 후기 ${rs.length}개`;

  if (rs.length === 0) {
    list.appendChild(makeEmpty("아직 후기가 없어요. 첫 후기를 남겨보세요! (데모)"));
  } else {
    rs.forEach(r => list.appendChild(makeReviewCard(r)));
  }
}


async function renderApply(){
  const job = state.jobs.find(j => j.id === state.selectedJobId);
  if (!job) return goto("home");

  $("#apply-job-title").textContent = `${job.company} · ${job.title}`;

  // 기본은 폼 숨기고, 선택 카드 보여주기
  $("#apply-simple-form").style.display = "none";
  $("#apply-resume-card").style.display = "none";
  $("#apply-no-resume-card").style.display = "none";

  // 1) 이력서 조회 (세션 기반)
  const res = await fetch("/api/resumes/me", { credentials: "include" });

  if (res.status === 401) {
    alert("로그인이 필요합니다.");
    return goto("login");
  }

  // 2) 이력서 없음 -> 카드 A
  if (res.status === 204) {
    $("#apply-no-resume-card").style.display = "block";

    // 이력서 작성하러 가기
    $("#btn-go-resume").onclick = () => goto("resume");

    // 이력서 없이 지원(간단폼)
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // 3) 이력서 있음 -> 카드 B + 요약 표시
  if (!res.ok) {
    console.error("이력서 조회 실패:", res.status, await res.text().catch(()=> ""));
    // 실패 시에도 간단 지원은 열어주자
    $("#apply-no-resume-card").style.display = "block";
    $("#btn-go-resume").onclick = () => goto("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  const r = await res.json();
  $("#apply-resume-card").style.display = "block";

  // ✅ updatedAt 내려주고 있으면 여기 표시 가능(없으면 '-'로)
  // 서버 응답에 updatedAt 필드가 없으면 일단 숨기거나 '-' 유지
  $("#apply-resume-updated").textContent = `마지막 수정: ${formatResumeUpdated(r.updatedAt)}`;

  // ✅ 요약 블록(대충 어떤 내용인지)
  $("#apply-resume-summary").innerHTML = buildResumeSummaryHTML(r);

  // 이력서 보기/수정
  $("#btn-edit-resume").onclick = () => goto("resume");

  // ✅ 이력서로 지원하기
  $("#btn-apply-with-resume").onclick = async () => {
    if (!confirm("이 공고에 이력서로 지원하시겠습니까?")) return;

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          jobId: state.selectedJobId,
          useResume: true
        })
      });

      if (!res.ok) throw new Error(await res.text());
      alert("✅ 지원 완료! 사장님이 확인할 수 있습니다.");
      goto("home");
    } catch (err) {
      console.error(err);
      alert("지원 중 오류가 발생했습니다: " + err.message);
    }
  };

  // 간단 지원서 보내기 
  $("#btn-submit-apply").onclick = async () => {
    const data = {
      jobId: state.selectedJobId,
      useResume: false,
      name: $("#apply-name").value.trim(),
      phone: $("#apply-phone").value.trim(),
      intro: $("#apply-intro").value.trim(),
      desc: $("#apply-desc").value.trim()
    };

    if (!data.name || !data.phone) {
      return alert("이름과 연락처를 입력해주세요.");
    }

    try {
      const res = await fetch("/api/applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data)
      });

      if (!res.ok) throw new Error(await res.text());
      alert("✅ 간단 지원이 완료되었습니다!");
      goto("home");
    } catch (err) {
      alert("지원 실패: " + err.message);
    }
  };

}


// 간단지원 폼 열기 + 자동 채우기
function openSimpleApplyForm(){
  $("#apply-simple-form").style.display = "block";

  // 기본정보는 users/me에서 자동 채우면 UX 좋아짐
  fetch("/api/users/me", { credentials: "include" })
    .then(res => res.ok ? res.json() : null)
    .then(me => {
      if (!me) return;
      $("#apply-name").value = me.name ?? "";
      $("#apply-phone").value = me.phone ?? "";
    })
    .catch(()=>{});
}


function buildResumeSummaryHTML(r) {
  return `
    <div><b>희망 시급:</b> ${r.desiredWage ? r.desiredWage + "원" : "협의"}</div>
    <div><b>가능 요일:</b> ${r.days?.join(", ") || "요일 미입력"}</div>
    <div><b>가능 시간:</b> ${r.timeStart || ""} ~ ${r.timeEnd || ""}</div>
    <div><b>경력:</b> ${(r.experiences && r.experiences.length > 0)
      ? r.experiences.map(e => e.storeName + " (" + e.roleText + ")").join(", ")
      : "경력 없음"}</div>
    <div><b>보유 스킬:</b> ${r.skills?.join(", ") || "없음"}</div>
  `;
}

// 날짜 포맷
function formatResumeUpdated(dateStr) {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  return d.toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}



async function renderMyJobs() {
  const listEl = $("#myjobs-list");
  listEl.innerHTML = "<div class='empty'>지원 내역을 불러오는 중...</div>";

  const res = await fetch("/api/applications/my", { credentials: "include" });

  if (res.status === 401) {
    listEl.innerHTML = "<div class='empty'>로그인이 필요합니다.</div>";
    return;
  }

  if (!res.ok) {
    listEl.innerHTML = "<div class='empty'>불러오기에 실패했습니다.</div>";
    return;
  }

  const jobs = await res.json();

  if (jobs.length === 0) {
    listEl.innerHTML = "<div class='empty'>아직 지원한 공고가 없습니다.</div>";
    return;
  }

  listEl.innerHTML = jobs.map(j => `
    <div class="job-card">
      <div class="job-top">
        <div>
          <div class="job-title">${j.jobTitle}</div>
          <div class="job-company">${j.storeName}</div>
          <div class="badge pay">
            ${(j.wage ?? 0).toLocaleString()}원/${j.wageType === "HOURLY" ? "시" : "건"}
          </div>
        </div>
      </div>

      <div class="job-meta">
        <div>${j.regionCity} ${j.regionDistrict}</div>
        <div>${formatDate(j.appliedAt)} 지원</div>
      </div>

      <div class="job-status">
        ${
          j.readAt
            ? `<div class="badge viewed">👀 사장님 열람함 (${formatDate(j.readAt)})</div>`
            : `<div class="badge not-viewed">📭 아직 확인 안함</div>`
        }
      </div>
    </div>
  `).join("");
}


function formatDate(dateStr) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${(d.getMonth() + 1)
    .toString()
    .padStart(2, "0")}.${d.getDate().toString().padStart(2, "0")}`;
}


function renderMessages(){
  const listEl = $("#message-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const msgs = store.get("mg_msgs", []);
  if (msgs.length === 0){
    listEl.appendChild(makeEmpty("아직 메시지가 없어요. 공고에 지원하면 사장님 답장이 여기로 와요! (데모)"));
    return;
  }
  msgs.forEach(m => listEl.appendChild(makeMsgCard(m)));
}

function renderReviews(){
  const listEl = $("#review-list");
  if (!listEl) return;
  listEl.innerHTML = "";

  const items = reviews.slice().sort((a,b) => b.stars - a.stars);
  items.forEach(r => listEl.appendChild(makeReviewCard(r)));
}

// 🟦 사장님 페이지 렌더링
async function renderOwner() {
  try {
    // 1️⃣ 내 공고 목록 불러오기
    const res = await fetch("/api/jobs/mine", { credentials: "include" });
    if (!res.ok) throw new Error("내 공고 목록 조회 실패");

    const jobs = await res.json();
    const list = $("#owner-job-list");
    list.innerHTML = ""; // 초기화

    // 2️⃣ 공고 없을 때
    if (jobs.length === 0) {
      list.innerHTML = `<div class="empty">등록된 공고가 없습니다.</div>`;
    } 
    // 3️⃣ 공고 있을 때
    else {
      list.innerHTML = jobs.map(j => buildOwnerJobCard(j)).join("");

      // 각 카드 내 “지원자 보기” 버튼 연결
      $$(".btn-view-applicants").forEach(btn => {
        btn.onclick = () => openApplicantsScreen(btn.dataset.jobId);
      });
    }

    // 4️⃣ 상단 버튼 연결
    $("#btn-owner-go-post").onclick = () => goto("post");

  } catch (err) {
    console.error(err);
    alert("공고 목록을 불러오는 중 오류가 발생했습니다.");
  }
}


// 🟨 공고 카드 HTML 생성
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
        <span class="badge pay">${j.wage.toLocaleString()}원/${j.wageType}</span>
        <span class="badge">${j.regionCity} ${j.regionDistrict}</span>
      </div>
    </div>
  `;
}

// 지원자 한 명의 카드 HTML 생성
function buildApplicantCard(a) {
  const skills = (a.skills && a.skills.length > 0) ? a.skills.join(", ") : "보유 스킬 없음";
  const exps = (a.experiences && a.experiences.length > 0) ? a.experiences.join(", ") : "경력 없음";

  const statusClass = a.status === "ACCEPTED" ? "accepted" :
                      a.status === "REJECTED" ? "rejected" : "";

  // ✅ 상태별 액션 버튼 UI
  const actionButtons =
    a.status === "ACCEPTED"
      ? `
        <div class="applicant-actions-vertical">
          <div class="hire-label">✅ 채용됨</div>
          <button class="btn message">메시지</button>
        </div>
      `
      : `
        <div class="applicant-actions-vertical">
          <button class="btn reject">거절</button>
          <button class="btn accept">채용</button>
          <button class="btn message">메시지</button>
        </div>
      `;

  const reviewBtn = a.status === "ACCEPTED"
    ? `<button class="btn outline review-btn">📝 후기 남기기</button>`
    : "";

  return `
    <div class="msg-card ${statusClass}" data-id="${a.id}">
      <div class="applicant-card-inner">
        <div class="applicant-info">
          <div class="msg-title">${a.applicantName || "이름 없음"} (${a.applicantAge || "-"}세)</div>
          <div class="msg-text">${a.description || "자기소개 없음"}</div>
          <div class="msg-meta">📞 ${a.applicantPhone || "비공개"} · 🕒 ${formatDate(a.createdAt)}</div>
          <div class="msg-extra">💼 경력: ${exps}</div>
          <div class="msg-extra">🧩 스킬: ${skills}</div>
        </div>

        ${actionButtons}
      </div>

      ${reviewBtn}
    </div>
  `;
}

// ✍ 리뷰 작성 화면 들어갈때 초기화 함수 
function initReviewWriteScreen() {
  // ✅ 기본 별점 5점
  const star5 = document.querySelector("#star5");
  if (star5) star5.checked = true;

  // ✅ 코멘트 초기화
  const comment = $("#review-comment");
  if (comment) comment.value = "";

  // ✅ 안내 문구(선택)
  const sub = $("#review-write-sub");
  if (sub && state.reviewTargetAppId) {
    sub.textContent = `지원 ID #${state.reviewTargetAppId} 에 대한 후기를 남겨주세요.`;
  }
}

// ✍ 취소버튼 - > 지원자 목록으로 돌아가
$("#btn-cancel-review")?.addEventListener("click", () => {
  state.reviewTargetAppId = null;
  goto("applicants");
});


// 이력서 화면을 사장님 쪽에서 열었을떄 
function openResumeViewMode(resume) {
	
	state.resumeMode = "APPLICANT";   // ✅ 지원자 모드로 전환
	state.viewingResume = resume;     // ✅ 임시 저장
	goto("resume");
	
}
	

// '목록' 버튼 클릭 시 applicants 화면으로 이동
$("#btn-back-applicants")?.addEventListener("click", () => {
  state.resumeMode = "ME";
  state.viewingResume = null;
  goto("applicants");
});

// =============================================
// ✅ applicants-list 클릭 이벤트는 "하나"로 통합
// - 후기 버튼 / 거절 / 채용 / 메시지 / 카드 클릭(이력서 열기)
// =============================================
$("#applicants-list").addEventListener("click", async (e) => {
  const card = e.target.closest(".msg-card");
  if (!card) return;

  const appId = card.dataset.id;

  // =====================================================
  // 1) ✅ 후기 남기기 버튼 (가장 먼저 처리해야 튐 방지)
  // =====================================================
  if (e.target.classList.contains("review-btn")) {
    e.preventDefault();
    e.stopPropagation(); // ✅ 혹시 모를 전파 차단 (안전장치)

    state.selectedApplicationIdForReview = appId; // ✅ 후기 작성 시 필요하면 사용
    goto("reviewWrite");
    return;
  }

  // =====================================================
  // 2) ✅ 액션 버튼 영역(거절/채용/메시지)
  //    - 이 영역 클릭이면 "이력서 열기" 로직 타면 안 됨
  // =====================================================
  if (e.target.closest(".applicant-actions-vertical")) {

    // 거절
    if (e.target.classList.contains("reject")) {
      if (confirm("이 지원자를 거절하시겠습니까?")) {
        await updateApplicantStatus(appId, "REJECTED");
        card.remove(); // 화면에서도 제거
      }
      return;
    }

    // 채용
    if (e.target.classList.contains("accept")) {
      if (confirm("이 지원자를 채용하시겠습니까?")) {
        await updateApplicantStatus(appId, "ACCEPTED");

        // ✅ UI 즉시 반영
        card.classList.add("accepted");
        card.classList.remove("rejected");

        // ✅ 버튼 영역을 "채용됨 + 메시지"로 교체 (선택)
        const actions = card.querySelector(".applicant-actions-vertical");
        if (actions) {
          actions.innerHTML = `
            <div class="hire-label">✅ 채용됨</div>
            <button class="btn message">메시지</button>
          `;
        }

        // ✅ 후기 버튼 없으면 추가 (선택)
        if (!card.querySelector(".review-btn")) {
          card.insertAdjacentHTML(
            "beforeend",
            `<button class="btn outline review-btn">📝 후기 남기기</button>`
          );
        }
      }
      return;
    }

    // 메시지
    if (e.target.classList.contains("message")) {
      alert("메시지 기능은 준비 중입니다.");
      return;
    }

    return; // 액션 영역이면 여기서 종료
  }

  // =====================================================
  // 3) ✅ 카드 클릭 = 이력서 열기
  // =====================================================
  try {
    state.resumeMode = "ME"; // (너 코드 유지) - 사실 여기서는 APPLICANT로 바꾸는게 맞지만, 기존 흐름 유지
    const res = await fetch(`/api/applications/${appId}/resume`, { credentials: "include" });

    if (!res.ok) {
      alert("이력서가 등록되지 않은 지원자입니다.");
      return;
    }

    const resume = await res.json();
    openResumeViewMode(resume);
  } catch (err) {
    console.error(err);
    alert("이력서를 불러오는 중 오류가 발생했습니다.");
  }
});


// 날짜 포맷 함수 (선택 사항)
function formatDate(isoString) {
  if (!isoString) return "-";
  const d = new Date(isoString);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}


// 🟧 지원자 보기 클릭 시
// 🟨 지원자 보기 화면 전환 함수
async function openApplicantsScreen(jobId) {
  try {
	
	console.log("jobID : " + jobId);
	
    // API 호출
    const res = await fetch(`/api/applications/by-job/${jobId}`, { credentials: "include" });
    if (!res.ok) throw new Error("지원자 목록 조회 실패");

    const applicants = await res.json();
	console.log("✅ applicants:", applicants);

    const list = $("#applicants-list"); // 지원자 목록 뿌릴 영역

    // 결과 렌더링
    if (applicants.length === 0) {
      list.innerHTML = `<div class="empty">아직 지원자가 없습니다.</div>`;
    } else {
      list.innerHTML = applicants.map(a => buildApplicantCard(a)).join("");
    }

    // 지원자 목록 화면으로 이동
    goto("applicants");
  } catch (err) {
    console.error(err);
    alert("지원자 목록을 불러오는 중 오류가 발생했습니다.");
  }
}


// 상태 변경 요청 함수
async function updateApplicantStatus(appId, status) {
  const res = await fetch(`/api/applications/${appId}/status?status=${status}`, {
    method: "PATCH",
  });

  if (!res.ok) {
    alert("상태 변경에 실패했습니다.");
  }
}



// ======================================================
// 13) Auth + Role UI (✅ 로그인 안 된 상태도 applyRoleUI(false))
// ======================================================
function getUser(){
  return store.get("mg_user", null);
}
function setUser(user){
  store.set("mg_user", user);
}

async function syncHeaderAuthUI(){
  console.log("🔥 syncHeaderAuthUI 불러졌당~~~~");

  const btn = document.querySelector("#btn-header-login");
  if (!btn) return;

  try {
    const res = await fetch("/api/users/me", { credentials: "include"});

    if (res.ok) {
      const me = await res.json(); // { id, name, isOwner }

      // ✅ 헤더 버튼: "정유진님"
      btn.textContent = `${me.name}님`;
      btn.onclick = () => goto("profile");

      // ✅ 역할별 하단 네비 적용
      applyRoleUI(me.isOwner);
	  console.log(me.isOwner + "me.isOwner");

    } else {
      // ✅ 로그인 안 된 상태
      btn.textContent = "로그인";
      btn.onclick = () => goto("login");

      // ✅ 로그인 전(null) : 역할 전용 네비는 다 숨김
      applyRoleUI(null);
    }
  } catch (e) {
    // 네트워크/서버 에러 시도 로그인 전처럼 처리
    btn.textContent = "로그인";
    btn.onclick = () => goto("login");
    applyRoleUI(null);
  }
}

function applyRoleUI(isOwner) {
  const navMyjobs  = document.querySelector("#nav-myjobs");
  const navResume  = document.querySelector("#nav-resume");
  const navOwner   = document.querySelector("#nav-owner");
  const navMessage = document.querySelector("#nav-messages");

  // ✅ [1] 콘솔에서 실제 들어오는 값과 타입을 즉시 확인
  console.log("--- Role UI Update ---");
  console.log("입력된 isOwner 값:", isOwner);
  console.log("입력된 isOwner 타입:", typeof isOwner);

  // ✅ [2] 유연한 타입 변환 (문자열 "false", "true" 처리)
  let status = isOwner;
  if (isOwner === "false") status = false;
  if (isOwner === "true")  status = true;

  // ✅ [3] 로그인 여부 판단
  const isLoggedIn = (status === true || status === false);

  if (!isLoggedIn) {
    console.log("상태: 로그인 안됨 -> 모든 메뉴 표시");
    if (navMyjobs)  navMyjobs.style.display = "flex";
    if (navResume)  navResume.style.display = "flex";
    if (navOwner)   navOwner.style.display = "flex";
    return;
  }

  if (status === false) {
    console.log("상태: 알바생 -> 사장님 메뉴(navOwner) 숨김 실행");
    if (navMyjobs)  navMyjobs.style.display = "flex";
    if (navResume)  navResume.style.display = "flex";
    if (navOwner) {
        navOwner.style.display = "none";
        console.log("navOwner display 상태:", navOwner.style.display); // 'none'이 찍혀야 함
    }
  } else if (status === true) {
    console.log("상태: 사장님 -> 알바생 메뉴 숨김 실행");
    if (navMyjobs)  navMyjobs.style.display = "none";
    if (navResume)  navResume.style.display = "none";
    if (navOwner)   navOwner.style.display = "flex";
  }
}

// 로그아웃
$("#btn-logout")?.addEventListener("click", async () => {
  await fetch("/api/users/logout", { method: "POST" });
  alert("로그아웃!");
  applyRoleUI(false);
  syncHeaderAuthUI();
  goto("home");
});

// 로그인
$("#btn-login")?.addEventListener("click", async () => {
  const data = {
    username: $("#login-id").value.trim(),
    password: $("#login-pw").value.trim()
  };

  if (!data.username || !data.password) {
    alert("아이디와 비밀번호를 입력하세요.");
    return;
  }

  const res = await fetch("/api/users/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(data)
  });

  if (res.ok) {
    const me = await res.json(); // { name, isOwner }
    setUser({ id: data.username, nick: me.name });
    alert("로그인 성공!");
    await syncHeaderAuthUI();
    goto("home");
  } else {
    alert("아이디 또는 비밀번호가 틀렸습니다.");
  }
});

$("#btn-go-signup")?.addEventListener("click", () => goto("signup"));

// 회원가입
$("#btn-signup-complete")?.addEventListener("click", async () => {
  alert("✅ 가입하기 클릭됨");

  try {
    const phoneEl = $("#signup-phone");
    if (!phoneEl) {
      alert("❌ signup-phone input을 못 찾았어. (id 확인해줘: signup-phone)");
      return;
    }

    const data = {
      username: $("#signup-id")?.value.trim(),
      password: $("#signup-pw")?.value.trim(),
      name: $("#signup-name")?.value.trim(),
      birth: $("#signup-birth")?.value,
      phone: phoneEl.value.trim().replace(/-/g, ""), // ✅ 딱 한 번만
      isOwner: $("#signup-owner")?.checked || false
    };

    if (!data.username || !data.password || !data.name || !data.birth || !data.phone) {
      alert("모든 항목을 입력하세요.");
      return;
    }

    if (!/^\d{10,11}$/.test(data.phone)) {
      alert("전화번호를 올바르게 입력해줘! (숫자 10~11자리)");
      return;
    }

    console.log("✅ signup payload", data);

    const res = await fetch("/api/users/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });

    console.log("✅ signup response status:", res.status);

    // 서버가 에러를 텍스트로 줄 수도 있어서 항상 읽어둠
    const text = await res.text().catch(() => "");

    if (res.ok) {
      alert("회원가입 완료! 로그인 해주세요.");
      goto("login");
    } else {
      alert("회원가입 실패: " + (text || `HTTP ${res.status}`));
    }
  } catch (err) {
    console.error("❌ signup error", err);
    alert("회원가입 요청 중 오류: " + (err?.message || err));
  }
});


// ======================================================
// 14) Navigation (SPA)
// ======================================================
async function goto(screenKey){
	console.log("📱 화면 전환:", screenKey);
  // 1) 화면 active 토글
  Object.entries(screens).forEach(([k, el]) => {
    if (!el) return;
    el.classList.toggle("active", k === screenKey);
  });

  // 2) 하단 네비 active 토글
  $$(".nav-item").forEach(item =>
    item.classList.toggle("active", item.dataset.target === screenKey)
  );

  // 로그인/회원가입/상세/지원/공고작성 등에서는 네비 active 해제
  if (["login","signup","detail","apply","post"].includes(screenKey)) {
    $$(".nav-item").forEach(item => item.classList.remove("active"));
  }

  // ✅ 3) resume는 DOM 붙은 다음에 불러오기 (가장 중요)
  if (screenKey === "resume") {
    await new Promise(requestAnimationFrame);

    // ✅ 지원자 이력서 보기 모드면: 내 이력서 로딩 금지 + 화면에 지원자 데이터만 세팅
    if (state.resumeMode === "APPLICANT" && state.viewingResume) {
      fillResumeFormFromData(state.viewingResume); // 아래 Step 4에서 만들 함수
      lockResumeViewMode();                        // 아래 Step 4에서 만들 함수
      loadReviews(state.viewingResume.id);
      return;
    }

    // ✅ 기본(내 이력서) 모드
    state.resumeMode = "ME";
    await loadResumeProfile();
    await loadResumeFromDB();
  }


  // 4) 화면별 렌더링/로딩
  if (screenKey === "home") await renderHome();
  if (screenKey === "myjobs") renderMyJobs();
  if (screenKey === "messages") renderMessages();
  if (screenKey === "reviews") renderReviews();
  if (screenKey === "reviewWrite") initReviewWriteScreen();


  // ❌ resume는 위에서 DB로 불러오니까 loadResume() 같은 옛날 함수는 호출하지 마
  if (screenKey === "detail") await renderDetail();
  if (screenKey === "apply") renderApply();
  if (screenKey === "owner" && typeof renderOwner === "function") renderOwner();

  window.scrollTo({ top: 0, behavior: "smooth" });
}


$$("[data-goto]").forEach(btn => btn.addEventListener("click", () => goto(btn.dataset.goto)));
$$(".nav-item").forEach(item => item.addEventListener("click", () => goto(item.dataset.target)));

$("#btn-owner-go-post")?.addEventListener("click", () => goto("post"));
// ✅ 지원자 확인 버튼 (사장님 페이지)
$("#btn-owner-go-applicants")?.addEventListener("click", async () => {
  // 내 공고 중 첫 번째 공고로 테스트하거나, 나중엔 선택된 공고 ID로 대체
  const firstJob = state?.ownerJobs?.[0];
  if (!firstJob) {
    alert("불러온 공고가 없습니다.");
    return;
  }
  await openApplicantsScreen(firstJob.id);
});

function fillResumeFormFromData(resume) {
  $("#resume-name").value  = resume.name || "이름 없음";
  $("#resume-age").value   = resume.age || "-";
  $("#resume-phone").value = resume.phone || "비공개";

  $("#resume-wage").value = resume.desiredWage ?? "";
  $("#resume-wage-neg").checked = !!resume.wageNegotiable;

  // ✅ 요일: toggle로 하지 말고 setDaysUI로!
  setDaysUI(resume.days || [], !!resume.daysNegotiable);

  $("#resume-time-start").value = resume.timeStart ?? "";
  $("#resume-time-end").value   = resume.timeEnd ?? "";
  $("#resume-time-neg").checked = !!resume.timeNegotiable;

  $("#resume-intro").value = resume.introduction ?? "";

  // ✅ 경력: 너가 이미 만든 renderExperiences 재사용 (형식 맞춰주기)
  // resume.experiences 가 객체 배열이면 그대로 OK
  // 만약 문자열 배열이면 여기서 변환 필요
  renderExperiences(resume.experiences || []);

  // ✅ 스킬: setSkillsUI 재사용
  setSkillsUI(resume.skills || []);

  $("#screen-resume .screen-title").textContent = "지원자 이력서 열람";
}


function lockResumeViewMode() {
  $("#screen-resume").querySelectorAll("input, textarea, button").forEach(el => {
    if (el.id === "btn-back-applicants") {
      el.disabled = false;
      el.style.display = "block";
      return;
    }
    if (el.id === "btn-save-resume" || el.id === "btn-add-exp") {
      el.style.display = "none";
      return;
    }
    el.disabled = true;
  });
}



// ======================================================
// 15) Chips & Search & Slider
// ======================================================
$("#search-input")?.addEventListener("input", (e) => {
  state.query = e.target.value;
  renderHome();
});

$("#category-chips")?.addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (!chip) return;
  state.category = chip.dataset.category;
  $$(".chip").forEach(c => c.classList.toggle("active", c === chip));
  renderHome();
});

function setBanner(index){
  state.currentBanner = index % 2;
  if (slider) slider.style.transform = `translateX(${-state.currentBanner * 50}%)`;
}
setInterval(() => setBanner(state.currentBanner + 1), 4500);

$$(".banner-slide").forEach((slide) => {
  slide.addEventListener("click", () => {
    state.query = "";
    $("#search-input").value = "";
    state.category = "전체";
    $$(".chip").forEach(c => c.classList.toggle("active", c.dataset.category === "전체"));

    if (slide.dataset.banner === "urgent"){
      renderHome({ forceUrgent: true });
    } else {
      renderHome({ minPay: 11000 });
    }
  });
});

// ======================================================
// 16) Apply / Submit Apply (데모)
// ======================================================
$("#btn-apply")?.addEventListener("click", () => {
  const user = getUser();
  if (!user) {
    alert("지원하려면 로그인해야 해! (데모)");
    return goto("login");
  }
  goto("apply");
});

$("#btn-goto-myjobs")?.addEventListener("click", () => goto("myjobs"));

$("#btn-submit-apply")?.addEventListener("click", () => {
  const job = state.jobs.find(j => j.id === state.selectedJobId);
  if (!job) return;

  const name = $("#apply-name").value.trim();
  const phone = $("#apply-phone").value.trim();
  if (!name || !phone) return alert("이름/연락처는 꼭 입력해줘!");

  const apply = {
    id: cryptoRandomId(),
    jobId: job.id,
    company: job.company,
    title: job.title,
    region: job.region,
    pay: job.pay,
    time: job.time,
    at: new Date().toISOString(),
    name,
    phone,
    intro: $("#apply-intro").value.trim(),
    desc: $("#apply-desc").value.trim()
  };

  const list = store.get("mg_myjobs", []);
  list.unshift(apply);
  store.set("mg_myjobs", list);

  const msgs = store.get("mg_msgs", []);
  msgs.unshift({
    id: cryptoRandomId(),
    title: `${job.company}에서 메시지`,
    text: `${name}님 지원서 확인했어요! 면접 가능 시간 알려주세요. (데모)`,
    at: new Date().toISOString()
  });
  store.set("mg_msgs", msgs);

  alert("지원 완료! 메시지 탭에서 확인해봐 😎 (데모)");
  goto("myjobs");
});

$("#btn-dummy-msg")?.addEventListener("click", () => {
  const msgs = store.get("mg_msgs", []);
  msgs.unshift({
    id: cryptoRandomId(),
    title: "테스트 메시지",
    text: "이건 데모 메시지야. 지원하면 이런 식으로 답장이 도착해!",
    at: new Date().toISOString()
  });
  store.set("mg_msgs", msgs);
  renderMessages();
});

// ======================================================
// 17) 공고 등록(Post) UI 로직 (✅ 예전 코드로 복구: 시간 선택 정상)
// ======================================================
(function initPostUI(){
  // ---- Pay mode (amount/negotiable) ----
  const payMode = document.querySelector("#pay-mode");
  const payAmountRow = document.querySelector("#pay-amount-row");
  const payInput = document.querySelector("#post-pay");

  function setPayMode(mode){
    payMode?.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));
    if (mode === "negotiable"){
      if (payAmountRow) payAmountRow.style.display = "none";
      if (payInput) payInput.value = "";
      payInput?.setAttribute("data-negotiable", "true");
    } else {
      if (payAmountRow) payAmountRow.style.display = "flex";
      payInput?.removeAttribute("data-negotiable");
    }
  }

  payMode?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setPayMode(btn.dataset.mode);
  });

  // ---- Days ----
  const dayWrap = document.querySelector("#post-days");
  const dayBtns = Array.from(dayWrap?.querySelectorAll(".day") || []);
  const daysQuick = document.querySelector("#days-quick");
  let daysNegotiable = false;

  const groups = {
    weekdays: ["MON","TUE","WED","THU","FRI"],
    weekend: ["SAT","SUN"],
    all: ["MON","TUE","WED","THU","FRI","SAT","SUN"]
  };

  function setDaysActive(dayCodes){
    dayBtns.forEach(b => b.classList.toggle("active", dayCodes.includes(b.dataset.day)));
  }

  function setDaysNegotiable(on){
    daysNegotiable = on;
    dayBtns.forEach(b => {
      b.classList.toggle("ghost", on);
      if (on) b.classList.remove("active");
    });
    daysQuick?.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
    if (on) daysQuick?.querySelector('[data-quick="negotiable"]')?.classList.add("active");
  }

  dayWrap?.addEventListener("click", (e) => {
    const btn = e.target.closest(".day");
    if (!btn) return;
    if (daysNegotiable) return;
    btn.classList.toggle("active");
  });

  daysQuick?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;

    const q = btn.dataset.quick;

    if (q === "negotiable"){
      setDaysNegotiable(true);
      return;
    }

    setDaysNegotiable(false);

    if (q === "clear"){
      setDaysActive([]);
      daysQuick.querySelectorAll(".seg-btn").forEach(b => b.classList.remove("active"));
      return;
    }

    if (groups[q]){
      setDaysActive(groups[q]);
      daysQuick.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.quick === q));
    }
  });

  // ---- Time mode ----
  const timeMode = document.querySelector("#time-mode");
  const timeSelectRow = document.querySelector("#time-select-row");
  const timeCustomRow = document.querySelector("#time-custom-row");
  const startSel = document.querySelector("#post-start");
  const endSel = document.querySelector("#post-end");
  const stepSel = document.querySelector("#time-step");
  const startCustom = document.querySelector("#post-start-custom");
  const endCustom = document.querySelector("#post-end-custom");
  let timeNegotiable = false;

  function buildTimes(stepMinutes){
    if (!startSel || !endSel) return;

    const step = Number(stepMinutes);
    const list = [];
    for (let h=0; h<24; h++){
      for (let m=0; m<60; m+=step){
        const hh = String(h).padStart(2,"0");
        const mm = String(m).padStart(2,"0");
        list.push(`${hh}:${mm}`);
      }
    }
    startSel.innerHTML = `<option value="">시작</option>` + list.map(t=>`<option value="${t}">${t}</option>`).join("");
    endSel.innerHTML   = `<option value="">종료</option>` + list.map(t=>`<option value="${t}">${t}</option>`).join("");
  }

  function setTimeMode(mode){
    timeMode?.querySelectorAll(".seg-btn").forEach(b => b.classList.toggle("active", b.dataset.mode === mode));

    if (mode === "negotiable"){
      timeNegotiable = true;
      if (timeSelectRow) timeSelectRow.style.display = "none";
      if (timeCustomRow) timeCustomRow.style.display = "none";
      if (startSel) startSel.value = "";
      if (endSel) endSel.value = "";
      if (startCustom) startCustom.value = "";
      if (endCustom) endCustom.value = "";
      return;
    }

    timeNegotiable = false;

    if (mode === "custom"){
      if (timeSelectRow) timeSelectRow.style.display = "none";
      if (timeCustomRow) timeCustomRow.style.display = "flex";
      return;
    }

    if (timeSelectRow) timeSelectRow.style.display = "flex";
    if (timeCustomRow) timeCustomRow.style.display = "none";
  }

  timeMode?.addEventListener("click", (e) => {
    const btn = e.target.closest(".seg-btn");
    if (!btn) return;
    setTimeMode(btn.dataset.mode);
  });

  stepSel?.addEventListener("change", (e) => buildTimes(e.target.value));

  // 초기
  buildTimes(stepSel?.value || 30);
  setPayMode("amount");
  setTimeMode("select");

  // ✅ 등록 버튼에서 쓰라고 전역으로 내보냄
  window.__postUiState = {
    getDaysNegotiable: () => daysNegotiable,
    getTimeNegotiable: () => timeNegotiable
  };
})();

// ======================================================
// 18) 공고 올리기(POST API 호출)
// ======================================================
function getActiveDataValue(groupSelector, dataKey) {
  const activeBtn = document.querySelector(`${groupSelector} .seg-btn.active`);
  return activeBtn ? activeBtn.dataset[dataKey] : null;
}

$("#btn-post-submit")?.addEventListener("click", async () => {
  const storeName = $("#post-company").value.trim();
  const title = $("#post-title").value.trim();

  const payMode = getActiveDataValue("#pay-mode", "mode");   // amount/negotiable
  const timeMode = getActiveDataValue("#time-mode", "mode"); // select/custom/negotiable

  const wageNegotiable = (payMode === "negotiable");
  const wage = wageNegotiable ? null : Number($("#post-pay").value);

  // 요일 수집
  const daysNegotiable = window.__postUiState?.getDaysNegotiable?.() ?? false;
  const days = daysNegotiable ? [] : $$("#post-days .day.active").map(b => b.dataset.day);

  // 시간 수집
  const timeNegotiable = (timeMode === "negotiable");
  let timeStart = null;
  let timeEnd = null;

  if (!timeNegotiable) {
    if (timeMode === "select") {
      timeStart = $("#post-start").value;
      timeEnd = $("#post-end").value;
    } else if (timeMode === "custom") {
      timeStart = $("#post-start-custom").value;
      timeEnd = $("#post-end-custom").value;
    }
  }

  const regionCity = $("#post-city").value;
  const regionDistrict = $("#post-district").value;
  const addressDetail = $("#post-address").value.trim();
  const description = $("#post-desc").value.trim();

  // 필수 검증
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

  const res = await fetch("/api/owner/job-posts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify(payload)
  });

  if (res.ok) {
    alert("공고 등록 완료!");
    goto("home");
  } else {
    const msg = await res.text().catch(() => "");
    alert("공고 등록 실패: " + (msg || "서버 오류"));
  }
});

// =====================================================
// 이력서
// =====================================================
/***********************
 * Resume JS (qs/qsa 버전)
 * - GET  /api/users/me
 * - GET  /api/resumes/me
 * - PUT  /api/resumes/me
 ***********************/

function qs(sel){ return document.querySelector(sel); }
function qsa(sel){ return Array.prototype.slice.call(document.querySelectorAll(sel)); }

function clearInputs(node) {
  qsa("input, textarea", node).forEach(function(el){ el.value = ""; });
}

function fmtPhone(phone) {
  var p = phone || "";
  if (p.length === 11) p = p.replace(/(\d{3})(\d{4})(\d{4})/, "$1-$2-$3");
  return p;
}

/* =======================
 * 1) 토글 UI
 * ======================= */
function bindResumeToggles() {
  // 요일 버튼 토글
  qsa("#resume-days .day").forEach(function(btn){
    btn.addEventListener("click", function(){
      // 요일 협의 active면 요일 선택 막기
      var negActive = qs("#resume-days-neg") && qs("#resume-days-neg").classList.contains("active");
      if (negActive) return;
      btn.classList.toggle("active");
    });
  });

  // 요일 협의
  var negBtn = qs("#resume-days-neg");
  if (negBtn) {
    negBtn.addEventListener("click", function(e){
      e.currentTarget.classList.toggle("active");
      var isNeg = e.currentTarget.classList.contains("active");

      qsa("#resume-days .day").forEach(function(d){
        d.classList.toggle("ghost", isNeg);
        if (isNeg) d.classList.remove("active");
      });
    });
  }

  // 스킬 토글
  qsa("#resume-skills .seg-btn").forEach(function(btn){
    btn.addEventListener("click", function(){
      btn.classList.toggle("active");
    });
  });
}

/* =======================
 * 2) 경력 추가/삭제
 * ======================= */
function bindExperienceUI() {
  var expList = qs("#exp-list");
  var addBtn = qs("#btn-add-exp");
  if (!expList) return;

  function addExpItem() {
    var first = expList.querySelector(".exp-item");
    if (!first) return;

    var clone = first.cloneNode(true);
    clearInputs(clone);
    expList.appendChild(clone);
  }

  if (addBtn) addBtn.addEventListener("click", addExpItem);

  expList.addEventListener("click", function(e){
    var btn = e.target.closest(".btn-remove-exp");
    if (!btn) return;

    var items = expList.querySelectorAll(".exp-item");
    var item = btn.closest(".exp-item");

    if (items.length <= 1) {
      clearInputs(item);
      return;
    }
    item.remove();
  });
}

/* =======================
 * 3) users/me 기본정보 채우기
 * ======================= */
async function loadResumeProfile() {
  try {
    var res = await fetch("/api/users/me", { credentials: "include" });
    if (!res.ok) return;

    var data = await res.json();

    var nameEl = qs("#resume-name");
    var ageEl = qs("#resume-age");
    var phoneEl = qs("#resume-phone");

    if (nameEl) nameEl.value = data.name || "";
    if (ageEl) ageEl.value = (data.age != null) ? (data.age + "세") : "";
    if (phoneEl) phoneEl.value = fmtPhone(data.phone);

  } catch (e) {
    console.error("프로필 로드 실패:", e);
  }
}

/* =======================
 * 4) 폼 -> payload 만들기
 * ======================= */
function getSelectedDays() {
  return qsa("#resume-days .day.active").map(function(b){ return b.dataset.day; });
}

function getSelectedSkills() {
  return qsa("#resume-skills .seg-btn.active").map(function(b){ return b.dataset.skill; });
}

function getExperiences() {
  return qsa("#exp-list .exp-item")
    .map(function(item){
      var store = (item.querySelector(".exp-store") || {}).value || "";
      var ind = (item.querySelector(".exp-industry") || {}).value || "";
      var period = (item.querySelector(".exp-period") || {}).value || "";
      var role = (item.querySelector(".exp-role") || {}).value || "";

      store = store.trim(); ind = ind.trim(); period = period.trim(); role = role.trim();

      return { storeName: store, industry: ind, periodText: period, roleText: role };
    })
    .filter(function(e){
      return e.storeName || e.industry || e.periodText || e.roleText;
    });
}

function buildResumePayload() {
  var wageEl = qs("#resume-wage");
  var wageRaw = wageEl ? wageEl.value : "";

  return {
    desiredWage: wageRaw ? Number(wageRaw) : null,
    wageNegotiable: !!(qs("#resume-wage-neg") && qs("#resume-wage-neg").checked),

    days: getSelectedDays(),
    daysNegotiable: !!(qs("#resume-days-neg") && qs("#resume-days-neg").classList.contains("active")),

    timeStart: (qs("#resume-time-start") && qs("#resume-time-start").value) ? qs("#resume-time-start").value : null,
    timeEnd: (qs("#resume-time-end") && qs("#resume-time-end").value) ? qs("#resume-time-end").value : null,
    timeNegotiable: !!(qs("#resume-time-neg") && qs("#resume-time-neg").checked),

    introduction: (qs("#resume-intro") && qs("#resume-intro").value) ? qs("#resume-intro").value.trim() : null,

    experiences: getExperiences(),
    skills: getSelectedSkills()
  };
}

/* =======================
 * 5) DB 데이터 -> UI 채우기
 * ======================= */
function setDaysUI(days, daysNegotiable) {
  days = days || [];
  var set = {};
  days.forEach(function(d){ set[d] = true; });

  var negBtn = qs("#resume-days-neg");
  if (negBtn) negBtn.classList.toggle("active", !!daysNegotiable);

  qsa("#resume-days .day").forEach(function(btn){
    btn.classList.toggle("ghost", !!daysNegotiable);
    btn.classList.toggle("active", !daysNegotiable && !!set[btn.dataset.day]);
  });
}

function setSkillsUI(skills) {
  skills = skills || [];
  var set = {};
  skills.forEach(function(s){ set[s] = true; });

  qsa("#resume-skills .seg-btn").forEach(function(btn){
    btn.classList.toggle("active", !!set[btn.dataset.skill]);
  });
}

function renderExperiences(exps) {
  var expList = qs("#exp-list");
  if (!expList) return;

  expList.innerHTML = "";

  function makeItem(exp) {
    exp = exp || {};
    var div = document.createElement("div");
    div.className = "exp-item";
    div.innerHTML = `
      <div class="row">
        <div class="input-group flex1">
          <label>근무처(가게명)</label>
          <input type="text" class="exp-store" placeholder="예) 스타카페 광주점" />
        </div>
        <div class="input-group flex1">
          <label>업종</label>
          <input type="text" class="exp-industry" placeholder="예) 카페, 편의점" />
        </div>
      </div>
      <div class="row">
        <div class="input-group flex1">
          <label>근무 기간</label>
          <input type="text" class="exp-period" placeholder="예) 2024.03 ~ 2024.09 / 6개월" />
        </div>
        <div class="input-group flex1">
          <label>역할</label>
          <input type="text" class="exp-role" placeholder="예) 음료 제조, 서빙, 마감" />
        </div>
      </div>
      <button type="button" class="btn danger small btn-remove-exp">삭제</button>
      <hr class="thin"/>
    `;

    div.querySelector(".exp-store").value = exp.storeName || "";
    div.querySelector(".exp-industry").value = exp.industry || "";
    div.querySelector(".exp-period").value = exp.periodText || "";
    div.querySelector(".exp-role").value = exp.roleText || "";

    return div;
  }

  if (!exps || exps.length === 0) {
    expList.appendChild(makeItem({}));
    return;
  }
  exps.forEach(function(exp){ expList.appendChild(makeItem(exp)); });
}

function resetResumeForm() {
  if (qs("#resume-wage")) qs("#resume-wage").value = "";
  if (qs("#resume-wage-neg")) qs("#resume-wage-neg").checked = false;

  setDaysUI([], false);

  if (qs("#resume-time-start")) qs("#resume-time-start").value = "";
  if (qs("#resume-time-end")) qs("#resume-time-end").value = "";
  if (qs("#resume-time-neg")) qs("#resume-time-neg").checked = false;

  if (qs("#resume-intro")) qs("#resume-intro").value = "";

  renderExperiences([]);
  setSkillsUI([]);
}

/* =======================
 * 6) GET /api/resumes/me
 * ======================= */
async function loadResumeFromDB() {
  console.log("✅ loadResumeFromDB called");
  try {
    var res = await fetch("/api/resumes/me", { credentials: "include" });
    console.log("✅ resumes/me status:", res.status);

    var text = await res.text();
    console.log("✅ resumes/me raw body:", text);

    // 204면 body 없음
    if (res.status === 204) { resetResumeForm(); return; }
    if (res.status === 401) { console.warn("❌ unauthorized"); return; }
    if (!res.ok) { console.error("❌ not ok"); return; }

    var data = JSON.parse(text);
    console.log("✅ resumes/me parsed:", data);

    if (qs("#resume-wage")) qs("#resume-wage").value = (data.desiredWage != null) ? data.desiredWage : "";
    if (qs("#resume-wage-neg")) qs("#resume-wage-neg").checked = !!data.wageNegotiable;

    setDaysUI(data.days || [], !!data.daysNegotiable);

    if (qs("#resume-time-start")) qs("#resume-time-start").value = data.timeStart || "";
    if (qs("#resume-time-end")) qs("#resume-time-end").value = data.timeEnd || "";
    if (qs("#resume-time-neg")) qs("#resume-time-neg").checked = !!data.timeNegotiable;

    if (qs("#resume-intro")) qs("#resume-intro").value = data.introduction || "";

    renderExperiences(data.experiences || []);
    setSkillsUI(data.skills || []);

  } catch (e) {
    console.error("이력서 불러오기 오류:", e);
  }
}

/* =======================
 * 7) PUT /api/resumes/me
 * ======================= */
async function saveResumeToDB() {
  try {
    var payload = buildResumePayload();

    var res = await fetch("/api/resumes/me", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(payload)
    });

    if (res.status === 401) {
      alert("로그인이 필요합니다.");
      return;
    }
    if (!res.ok) {
      console.error("저장 실패:", res.status, await res.text().catch(function(){ return ""; }));
      alert("저장 실패");
      return;
    }

    alert("이력서 저장 완료!");
  } catch (e) {
    console.error("저장 오류:", e);
    alert("저장 중 오류 발생");
 
}
}

function bindSaveButton() {
  const btn = document.querySelector("#btn-save-resume");
  if (!btn) return;
  if (btn.dataset.bound === "1") return;   // ✅ 중복 바인딩 방지
  btn.dataset.bound = "1";
  btn.addEventListener("click", saveResumeToDB);
}


// 이력서 화면 들어갈 떄만 불러오기 
async function openResumeScreen(){ 
	await loadResumeProfile(); 
	await loadResumeFromDB(); }

// ===========================================
// init
// ===========================================

document.addEventListener("DOMContentLoaded", async function () {
  // 1) 공통 UI 바인딩(한 번만)
  bindResumeToggles();
  bindExperienceUI();
  bindSaveButton();

  // 2) 지역/UI 기본 렌더
  syncRegionUI();


  // 3) ✅ 세션 기준으로 헤더/네비 동기화 (여기서 applyRoleUI까지 처리)
  await syncHeaderAuthUI();

  // 4) 초기 화면
  goto("home"); // 너 goto가 있으면
});






