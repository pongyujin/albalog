// /js/api/users.api.js
// 유저(인증/프로필) 관련 API

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

// ✅ 세션 기반 내 정보: GET /api/users/me
// - 로그인 상태면 { id, name, isOwner, phone, age ... } 등 서버 스펙 그대로
// - 비로그인이면 { ok:false, status:401 ... } 형태로 돌려줌 (throw 안 함)
export async function getMe() {
  const r = await request(`/api/users/me`, { method: "GET" });
  return r; // 호출부에서 r.ok / r.status로 처리
}

// ✅ 로그인: POST /api/users/login
// body: { username, password }
// 성공 시 서버가 { name, isOwner, ... } 내려주면 data로 반환
export async function login({ username, password }) {
  const r = await request(`/api/users/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password })
  });

  if (!r.ok) throw new Error(r.text || `로그인 실패 (HTTP ${r.status})`);
  return r.data;
}

// ✅ 회원가입: POST /api/users/signup
// payload 스펙은 너가 쓰던 그대로: { username, password, name, birth, phone, isOwner }
export async function signup(payload) {
  const r = await request(`/api/users/signup`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload || {})
  });

  if (!r.ok) throw new Error(r.text || `회원가입 실패 (HTTP ${r.status})`);
  return r.data; // 서버가 뭘 주든 그대로
}

// ✅ 로그아웃: POST /api/users/logout
export async function logout() {
  const r = await request(`/api/users/logout`, { method: "POST" });
  if (!r.ok) throw new Error(r.text || `로그아웃 실패 (HTTP ${r.status})`);
  return true;
}
