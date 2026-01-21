// /js/screens/chat.screen.js
// ✅ 채팅 화면 모듈 (SPA screen)
// - REST: 채팅방 조회 + 히스토리 로딩
// - STOMP: 실시간 메시지 송수신

import { $ } from "../core/dom.js";

let __goto = null;              // app.js에서 주입받을 goto 함수
let __chatContext = null;      // 현재 채팅 컨텍스트 (applicationId, roomId 등)
let stompClient = null;        // STOMP 클라이언트 객체
let __meId = null; // ✅ 내 로그인 유저 id (읽음 처리/내 메시지 구분에 필요)


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

  try {
    const meRes = await fetch("/api/users/me");
    if (meRes.ok) {
      const me = await meRes.json();
      __meId = me.id;
    }
  } catch {}

  if (!__chatContext?.applicationId) {
    $("#chat-title").textContent = "채팅";
    $("#chat-sub").textContent = "applicationId가 없습니다.";
    return;
  }

  const applicationId = __chatContext.applicationId;

  $("#chat-title").textContent = `채팅 (지원서 #${applicationId})`;
  $("#chat-sub").textContent = "채팅방 불러오는 중...";
  $("#chat-list").innerHTML = "";

  try {
    // 1) 채팅방 조회
    const room = await fetchRoomByApplication(applicationId);
    __chatContext.roomId = room.roomId;

    $("#chat-sub").textContent = `채팅방 #${room.roomId}`;

    // 2) 히스토리 조회
    const messages = await fetchMessages(room.roomId);
    messages.reverse().forEach(renderMessage);

    // 3) ✅ STOMP 연결/구독 완료까지 기다리기
    await connectStomp(room.roomId);

    // 4) ✅ 구독 완료 후 읽음 전송 (들어오자마자 읽음 반영)
    if (messages.length > 0) {
      const lastId = messages[messages.length - 1].id;
      sendRead(lastId);
    }

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

function handleReadEvent(ev) {
    // ✅ 내가 보낸 read 이벤트면 무시 (상대 read만 반영)
    if (__meId && Number(ev.userId) === Number(__meId)) return;

    const list = $("#chat-list");
    if (!list) return;

    // ✅ 내 메시지 중 마지막 것 찾기
    const myItems = Array.from(list.querySelectorAll(".chat-item.mine"));
    if (myItems.length === 0) return;

    const lastMyItem = myItems[myItems.length - 1];
    const bubble = lastMyItem.querySelector(".chat-bubble");

    const msgId = bubble?.dataset?.messageId ? Number(bubble.dataset.messageId) : null;
    if (!msgId) return;

    // ✅ 상대가 내 마지막 메시지 id 이상을 읽었다면 "읽음" 표시
    if (Number(ev.lastReadMessageId) >= msgId) {
        // ✅ 이전 읽음 표시 지우고(옵션)
        list.querySelectorAll(".chat-read").forEach((el) => (el.textContent = ""));

        const readEl = lastMyItem.querySelector(".chat-read");
        if (readEl) readEl.textContent = "읽음";
    }
}


/* ======================================================
   ✅ STOMP 실시간 연결
   ====================================================== */

   let __subscribedRoomId = null; // ✅ 지금 구독 중인 roomId 기억

   function connectStomp(roomId) {
     return new Promise((resolve, reject) => {

       // ✅ 이미 같은 roomId로 구독 중이면 그대로 사용
       if (stompClient && stompClient.connected && __subscribedRoomId === roomId) {
         resolve();
         return;
       }

       // ✅ 다른 방으로 이동한 경우: 기존 연결이 있으면 끊고 새로 연결
       if (stompClient && stompClient.connected && __subscribedRoomId !== roomId) {
         try {
           stompClient.disconnect(() => {
             stompClient = null;
             __subscribedRoomId = null;
             // ✅ 끊은 뒤 새로 연결
             _connectNew(roomId, resolve, reject);
           });
           return;
         } catch (e) {
           // disconnect 실패해도 새로 연결 시도
           stompClient = null;
           __subscribedRoomId = null;
         }
       }

       // ✅ 연결이 없으면 새로 연결
       _connectNew(roomId, resolve, reject);
     });
   }

   function _connectNew(roomId, resolve, reject) {
     const socket = new SockJS("/ws-chat");
     stompClient = Stomp.over(socket);
     stompClient.debug = null;

     stompClient.connect({}, () => {
       console.log("✅ STOMP 연결 성공");

       __subscribedRoomId = roomId; // ✅ 구독 방 저장

       // ✅ 메시지 구독
       stompClient.subscribe(`/topic/chat.room.${roomId}`, (msg) => {
         const data = JSON.parse(msg.body);
         renderMessage(data);
         sendRead(data.id); // ✅ 화면 열려있으면 바로 읽음 처리
       });

       // ✅ 읽음 구독
       stompClient.subscribe(`/topic/chat.read.${roomId}`, (msg) => {
         const data = JSON.parse(msg.body);
         handleReadEvent(data);
       });

       resolve(); // ✅ 구독까지 끝났으니 이제 sendRead 해도 안전
     }, (err) => {
       reject(err);
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

function sendRead(lastReadMessageId) {
    if (!stompClient || !stompClient.connected) return;
    if (!__chatContext?.roomId) return;
    if (!lastReadMessageId) return;

    stompClient.send("/app/chat.read", {}, JSON.stringify({
        roomId: __chatContext.roomId,
        lastReadMessageId: Number(lastReadMessageId)
    }));
}



/* ======================================================
   ✅ 화면 렌더
   ====================================================== */

function renderMessage(m) {
    const list = $("#chat-list");

    const wrap = document.createElement("div");
    wrap.className = "chat-item";

    // ✅ 내/상대 메시지 구분 (읽음 표시 위치 정확히 잡으려고)
    const isMine = __meId && Number(m.senderId) === Number(__meId);
    wrap.classList.add(isMine ? "mine" : "other");

    const div = document.createElement("div");
    div.className = "chat-bubble";
    div.dataset.messageId = String(m.id); // ✅ 읽음 계산용
    div.textContent = `[${m.senderId}] ${m.content}`;

    const read = document.createElement("div");
    read.className = "chat-read";
    read.textContent = "";

    wrap.appendChild(div);
    wrap.appendChild(read);

    list.appendChild(wrap);
    list.scrollTop = list.scrollHeight;
}

