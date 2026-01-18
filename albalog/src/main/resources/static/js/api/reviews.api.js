// /js/api/reviews.api.js
// 후기(Review) API 전담
// - POST /api/reviews : 사장님이 지원(application)에 후기 작성
// - GET  /api/reviews/by-worker/{workerId} : 알바생(받은) 후기 목록
// - GET  /api/reviews/by-job/{jobPostId}   : 공고 기준 후기 목록

// ✅ JSON 요청 헤더(POST/PUT 등에서 사용)
const JSON_HEADERS = { "Content-Type": "application/json" };

/**
 * ✅ 공통 fetch 래퍼
 * - 항상 credentials: include 로 세션 쿠키 포함
 * - 응답을 { ok, status, text, data } 형태로 통일
 * - data는 JSON 파싱 성공 시에만 채움
 *
 * @param {string} url
 * @param {RequestInit} options
 * @returns {Promise<{ok:boolean,status:number,text:string,data:any}>}
 */
async function request(url, options = {}) {
  // ---------------------------------------------
  // 1) fetch 호출 (세션 기반이면 credentials 필수)
  // ---------------------------------------------
  const res = await fetch(url, {
    credentials: "include",
    ...options
  });

  // ---------------------------------------------
  // 2) 응답 body를 텍스트로 우선 확보
  //    (서버가 에러를 text로 줄 수도 있음)
  // ---------------------------------------------
  const text = await res.text().catch(() => "");

  // ---------------------------------------------
  // 3) JSON 파싱 시도 (실패하면 data는 null 유지)
  // ---------------------------------------------
  let data = null;
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = null;
  }

  // ---------------------------------------------
  // 4) 통일된 응답 형태 반환
  // ---------------------------------------------
  return {
    ok: res.ok,
    status: res.status,
    text,
    data
  };
}

/**
 * ✅ 후기 작성
 * - 사장님만 가능 (서버에서 403 처리)
 *
 * @param {Object} payload
 * @param {number|string} payload.applicationId - 어떤 지원건(application)에 대한 후기인지
 * @param {number|string} payload.rating - 0.5 단위 (0.5~5.0)
 * @param {string} payload.comment - 코멘트(필수)
 * @returns {Promise<Object>} ReviewResponse
 *
 * throws Error("UNAUTHORIZED") : 로그인 필요(401)
 * throws Error("FORBIDDEN")    : 사장님만 가능(403)
 * throws Error("...")          : 기타 서버 메시지/HTTP 코드
 */
export async function createReview(payload) {
  // ---------------------------------------------
  // 1) POST 요청
  // ---------------------------------------------
  const r = await request("/api/reviews", {
    method: "POST",
    headers: JSON_HEADERS,
    body: JSON.stringify(payload)
  });

  // ---------------------------------------------
  // 2) 실패 시 예외로 던져서 UI에서 분기 처리 쉽게
  // ---------------------------------------------
  if (!r.ok) {
    if (r.status === 401) throw new Error("UNAUTHORIZED");
    if (r.status === 403) throw new Error("FORBIDDEN");

    // 서버가 친절한 메시지를 text로 줬으면 그걸 우선 사용
    throw new Error(r.text || `HTTP_${r.status}`);
  }

  // ---------------------------------------------
  // 3) 성공 시 ReviewResponse 반환
  // ---------------------------------------------
  return r.data;
}

/**
 * ✅ 알바생(Worker) 기준 받은 후기 목록 조회
 *
 * @param {number|string} workerId
 * @returns {Promise<{ok:boolean,status:number,text:string,data:any}>}
 */
export async function getReviewsByWorker(workerId) {
  // workerId는 숫자여야 해서 방어(선택)
  // (서버가 PathVariable Long이라서 문자열 숫자도 보통 동작함)
  return await request(`/api/reviews/by-worker/${workerId}`);
}

/**
 * ✅ 공고(JobPost) 기준 후기 목록 조회
 *
 * @param {number|string} jobPostId
 * @returns {Promise<{ok:boolean,status:number,text:string,data:any}>}
 */
export async function getReviewsByJob(jobPostId) {
  return await request(`/api/reviews/by-job/${jobPostId}`);
}
