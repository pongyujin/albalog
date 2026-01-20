// /js/screens/chat.screen.js
// ✅ 채팅 화면 모듈 (SPA screen)
// - 지금 단계 목표: REST로 "방 조회 + 메시지 히스토리 로딩" 까지

import { $ } from "../core/dom.js";

let __goto = null;            // ✅ app.js에서 주입받을 goto 함수
let __chatContext = null;     // ✅ 현재 채팅 화면에서 사용할 컨텍스트(applicationId, backTo, roomId 등)

/**
 * ✅ 초기화 함수: app.js에서 goto를 주입해줌
 * - 순환 import 문제를 피하려고 이렇게 받는 게 안전함
 */
export function initChatScreen({ goto }) {
  __goto = goto;

  // ✅ 뒤로가기 버튼: 이전 화면으로 돌아가기
  $("#btn-chat-back")?.addEventListener("click", () => {
    if (__chatContext?.backTo) {
      __goto(__chatContext.backTo);
      return;
    }
    __goto("messages"); // fallback
  });

  // ✅ 전송 버튼: 아직 STOMP 전이니까 일단 "나중에 연결"만 걸어둠
  $("#btn-chat-send")?.addEventListener("click", () => {
    // TODO: 다음 단계에서 STOMP 연결 후 여기서 send 할 예정
    alert("다음 단계: STOMP 연결 후 전송 구현");
  });
}

/**
 * ✅ 외부(지원자목록/myjobs 등)에서 채팅 열 때 호출
 * - applicationId를 전달받아서 채팅 화면에서 사용할 컨텍스트로 저장
 */
export async function openChatScreen({ applicationId, backTo }) {
  __chatContext = {
    applicationId,
    backTo: backTo || "messages",
    roomId: null
  };

  // ✅ 화면 이동
  __goto("chat");
}

/**
 * ✅ chat screen 진입 시 호출되는 렌더 함수
 * - 여기서 REST 호출로 room 조회 + 메시지 히스토리 로딩
 */
export async function renderChatScreen() {
  if (!__chatContext?.applicationId) {
    $("#chat-title").textContent = "채팅";
    $("#chat-sub").textContent = "applicationId가 없습니다.";
    return;
  }

  const applicationId = __chatContext.applicationId;

  // ✅ 화면 초기화
  $("#chat-title").textContent = `채팅 (지원서 #${applicationId})`;
  $("#chat-sub").textContent = "불러오는 중...";
  $("#chat-list").innerHTML = "";

  try {
    // 1) 방 조회 (채용 전이면 404가 올 수 있음)
    const room = await fetchRoomByApplication(applicationId);
    __chatContext.roomId = room.roomId;

    $("#chat-sub").textContent = `채팅방 #${room.roomId}`;

    // 2) 메시지 히스토리 조회
    const messages = await fetchMessages(room.roomId);

    // 3) 렌더
    messages.forEach(renderMessage);

    // ✅ 다음 단계: 여기서 STOMP connect + subscribe 붙일 예정
    // connectStomp(room.roomId);

  } catch (e) {
    console.error(e);
    $("#chat-sub").textContent = e?.message || "채팅 로딩 실패";
  }
}

/* =========================
   REST 호출 함수들
   ========================= */

/**
 * ✅ applicationId → 채팅방 조회
 */
async function fetchRoomByApplication(applicationId) {
  const res = await fetch(`/api/chat/rooms/by-application/${applicationId}`);
  if (!res.ok) {
    // ✅ 서버가 text로 에러를 줄 수도 있어서 우선 text로 받기
    const text = await res.text();
    throw new Error(text || "채팅방 조회 실패");
  }
  return await res.json(); // { roomId, applicationId, ownerId, workerId, jobPostId }
}

/**
 * ✅ roomId → 메시지 목록 조회
 */
async function fetchMessages(roomId) {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "메시지 목록 조회 실패");
  }
  return await res.json(); // [{id, senderId, content, createdAt, ...}]
}

/* =========================
   화면 렌더 함수들
   ========================= */

/**
 * ✅ 메시지 1개 렌더 (일단 단순하게)
 * - 다음 단계에서 "내 메시지/상대 메시지" 좌우 정렬도 붙이면 됨
 */
function renderMessage(m) {
  const list = $("#chat-list");

  const div = document.createElement("div");
  div.className = "chat-bubble";
  div.textContent = `[${m.senderId}] ${m.content}`;

  list.appendChild(div);

  // ✅ 항상 맨 아래 보이게 스크롤
  list.scrollTop = list.scrollHeight;
}
