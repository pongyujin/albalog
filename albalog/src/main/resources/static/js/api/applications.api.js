// /js/api/applications.api.js
// 지원(Application) 관련 API

async function request(url, options = {}) {
  const res = await fetch(url, {
    credentials: "include",
    ...options,
    headers: {
      ...(options.headers || {})
    }
  });

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

// ✅ 지원하기: POST /api/applications
// - 이력서 지원: { jobId, useResume:true }
// - 간단 지원: { jobId, useResume:false, name, phone, intro, desc }
export async function createApplication(payload) {
  const r = await request(`/api/applications`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });

  if (!r.ok) throw new Error(r.text || `지원 실패 (HTTP ${r.status})`);
  return r.data;
}

// ✅ 내 지원내역: GET /api/applications/my
export async function fetchMyApplications() {
  const r = await request(`/api/applications/my`, { method: "GET" });

  // 기존 renderMyJobs처럼 401을 호출부에서 UI 처리할 수 있게 throw 안 함
  return r; // { ok, status, data }
}

// ✅ 사장님: 특정 공고 지원자 목록: GET /api/applications/by-job/:jobId
export async function fetchApplicationsByJob(jobId) {
  const r = await request(`/api/applications/by-job/${encodeURIComponent(jobId)}`, { method: "GET" });
  if (!r.ok) throw new Error(r.text || `지원자 목록 조회 실패 (HTTP ${r.status})`);
  return Array.isArray(r.data) ? r.data : [];
}

// ✅ 사장님: 지원 상태 변경: PATCH /api/applications/:appId/status?status=ACCEPTED|REJECTED
export async function updateApplicationStatus(appId, status) {
  const r = await request(
    `/api/applications/${encodeURIComponent(appId)}/status?status=${encodeURIComponent(status)}`,
    { method: "PATCH" }
  );

  if (!r.ok) throw new Error(r.text || `상태 변경 실패 (HTTP ${r.status})`);
  return r.data;
}

// ✅ 사장님: 지원자 이력서 열람: GET /api/applications/:appId/resume
// - res.ok 아니면 “이력서 없음”으로 처리하는 기존 흐름 유지 가능
export async function fetchResumeByApplication(appId) {
  const r = await request(`/api/applications/${encodeURIComponent(appId)}/resume`, { method: "GET" });
  return r; // ok/status 기준으로 호출부에서 분기
}
