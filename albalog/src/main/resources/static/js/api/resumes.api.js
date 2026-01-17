// /js/api/resumes.api.js
// 이력서(Resume) 관련 API

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

// ✅ 내 이력서 조회: GET /api/resumes/me
// - 200: { ...resume }
// - 204: 이력서 없음 (data=null)
// - 401: 미로그인
export async function getMyResume() {
  const r = await request(`/api/resumes/me`, { method: "GET" });
  return r; // 호출부에서 status별 처리(204/401 등) 가능하게 유지
}

// ✅ 내 이력서 저장: PUT /api/resumes/me
export async function putMyResume(payload) {
  const r = await request(`/api/resumes/me`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });

  if (r.status === 401) {
    // 기존 로직처럼 “로그인 필요” 처리하기 좋게 throw
    throw new Error("UNAUTHORIZED");
  }
  if (!r.ok) throw new Error(r.text || `이력서 저장 실패 (HTTP ${r.status})`);

  return r.data; // 서버가 저장 결과를 주면 반환, 아니면 null
}
