// /js/api/jobs.api.js
// 공고(Job Posts) 관련 API

function buildQuery(paramsObj = {}) {
  const sp = new URLSearchParams();
  Object.entries(paramsObj).forEach(([k, v]) => {
    if (v === undefined || v === null || v === "") return;
    sp.set(k, String(v));
  });
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

  // 204 No Content
  if (res.status === 204) return { ok: true, status: 204, data: null, text: "" };

  const text = await res.text().catch(() => "");
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  return { ok: res.ok, status: res.status, data, text };
}

// ✅ 홈 리스트: GET /api/job-posts?regionCity=&regionDistrict=
export async function fetchJobPosts({ regionCity = null, regionDistrict = null } = {}) {
  const q = buildQuery({ regionCity, regionDistrict });
  const r = await request(`/api/job-posts${q}`, { method: "GET" });
  if (!r.ok) throw new Error(r.text || `공고 조회 실패 (HTTP ${r.status})`);
  return Array.isArray(r.data) ? r.data : [];
}

// ✅ 사장님: 내 공고 목록: GET /api/jobs/mine
export async function fetchMyOwnerJobs() {
  const r = await request(`/api/jobs/mine`, { method: "GET" });
  if (!r.ok) throw new Error(r.text || `내 공고 목록 조회 실패 (HTTP ${r.status})`);
  return Array.isArray(r.data) ? r.data : [];
}

// ✅ 사장님: 공고 등록: POST /api/owner/job-posts
export async function createOwnerJobPost(payload) {
  const r = await request(`/api/owner/job-posts`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });

  if (!r.ok) throw new Error(r.text || `공고 등록 실패 (HTTP ${r.status})`);
  return r.data; // 서버가 생성된 공고를 내려주면 그대로 반환, 아니면 null
}
