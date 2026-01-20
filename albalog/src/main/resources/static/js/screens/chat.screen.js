// /js/screens/chat.screen.js
// ✅ 채팅 화면 모듈 (SPA screen)
// - REST: 채팅방 조회 + 히스토리 로딩
// - STOMP: 실시간 메시지 송수신

import { $ } from "../core/dom.js";

let __goto = null;              // app.js에서 주입받을 goto 함수
let __chatContext = null;      // 현재 채팅 컨텍스트 (applicationId, roomId 등)
let stompClient = null;        // STOMP 클라이언트 객체

// ======================================================
// ✅ 초기화 함수 (app.js에서 goto 주입)
// ======================================================
export function initChatScreen({ goto }) {
  __goto = goto;

  // -------------------------------
  // 뒤로가기 버튼
  // -------------------------------
  $("#btn-chat-back")?.addEventListener("click", () => {
    if (__chatContext?.backTo) {
      __goto(__chatContext.backTo);
      return;
    }
    __goto("messages");
  });

  // -------------------------------
  // 메시지 전송 버튼
  // -------------------------------
  $("#btn-chat-send")?.addEventListener("click", sendMessage);
}


// ======================================================
// ✅ 외부에서 채팅 열기 (myjobs, applicants 등)
// ======================================================
export async function openChatScreen({ applicationId, backTo }) {
  __chatContext = {
    applicationId,
    backTo: backTo || "messages",
    roomId: null
  };

  // 화면 이동
  __goto("chat");
}


// ======================================================
// ✅ 채팅 화면 진입 시 렌더 함수
// ======================================================
export async function renderChatScreen() {

  // applicationId 없으면 방 입장 불가
  if (!__chatContext?.applicationId) {
    $("#chat-title").textContent = "채팅";
    $("#chat-sub").textContent = "applicationId가 없습니다.";
    return;
  }

  const applicationId = __chatContext.applicationId;

  // -------------------------------
  // 화면 초기화
  // -------------------------------
  $("#chat-title").textContent = `채팅 (지원서 #${applicationId})`;
  $("#chat-sub").textContent = "채팅방 불러오는 중...";
  $("#chat-list").innerHTML = "";

  try {
    // -------------------------------
    // 1) 채팅방 조회 (REST)
    // -------------------------------
    const room = await fetchRoomByApplication(applicationId);
    __chatContext.roomId = room.roomId;

    $("#chat-sub").textContent = `채팅방 #${room.roomId}`;

    // -------------------------------
    // 2) 메시지 히스토리 조회 (REST)
    // -------------------------------
    const messages = await fetchMessages(room.roomId);

    // 오래된 순서로 정렬
    messages.reverse().forEach(renderMessage);

    // -------------------------------
    // 3) STOMP 실시간 연결
    // -------------------------------
    connectStomp(room.roomId);

  } catch (e) {
    console.error(e);
    $("#chat-sub").textContent = e?.message || "채팅 로딩 실패";
  }
}


/* ======================================================
   ✅ REST API 호출
   ====================================================== */

// applicationId → 채팅방 조회
async function fetchRoomByApplication(applicationId) {
  const res = await fetch(`/api/chat/rooms/by-application/${applicationId}`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "채팅방 조회 실패");
  }
  return await res.json();
}

// roomId → 메시지 히스토리 조회
async function fetchMessages(roomId) {
  const res = await fetch(`/api/chat/rooms/${roomId}/messages?limit=50`);
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "메시지 목록 조회 실패");
  }
  return await res.json();
}


/* ======================================================
   ✅ STOMP 실시간 연결
   ====================================================== */

function connectStomp(roomId) {

  // 이미 연결되어 있으면 재연결 방지
  if (stompClient && stompClient.connected) {
    return;
  }

  // SockJS 소켓 생성
  const socket = new SockJS("/ws-chat");

  // STOMP 클라이언트 생성
  stompClient = Stomp.over(socket);

  // 콘솔 로그 제거 (깔끔하게)
  stompClient.debug = null;

  // 서버 연결
  stompClient.connect({}, () => {
    console.log("✅ STOMP 연결 성공");

    // -------------------------------
    // 채팅방 구독
    // -------------------------------
    stompClient.subscribe(`/topic/chat.room.${roomId}`, (msg) => {
      const data = JSON.parse(msg.body);
      renderMessage(data);
    });
  });
}


/* ======================================================
   ✅ 메시지 전송
   ====================================================== */

function sendMessage() {
  const input = $("#chat-input");
  const content = input.value.trim();

  if (!content) return;

  if (!stompClient || !stompClient.connected) {
    Swal.fire({
      icon: "error",
      title: "연결 오류",
      text: "채팅 서버에 연결되지 않았습니다.",
      confirmButtonText: "확인"
    });
    return;
  }

  // 서버로 메시지 전송
  stompClient.send("/app/chat.send", {}, JSON.stringify({
    roomId: __chatContext.roomId,
    content: content
  }));

  input.value = "";
}


/* ======================================================
   ✅ 화면 렌더
   ====================================================== */

function renderMessage(m) {
  const list = $("#chat-list");

  const div = document.createElement("div");
  div.className = "chat-bubble";

  // 내 메시지 / 상대 메시지 구분은 다음 단계에서 스타일링
  div.textContent = `[${m.senderId}] ${m.content}`;

  list.appendChild(div);

  // 항상 맨 아래 스크롤
  list.scrollTop = list.scrollHeight;
}
