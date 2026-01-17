// core/state.js
// 앱 전역 상태 + 데모 리뷰 데이터

import { store } from "./store.js";

export const reviews = [
  { id: "r1", jobId: "j1", name: "익명", stars: 5, text: "사장님이 친절하고 근무 동선이 깔끔해요. 바쁜 시간대에도 팀워크 좋아서 금방 적응했습니다." },
  { id: "r2", jobId: "j1", name: "라떼러버", stars: 4, text: "레시피가 정리돼있어서 초보도 따라가기 괜찮았어요. 다만 피크 타임은 정신없음!" },
  { id: "r3", jobId: "j2", name: "밤샘고수", stars: 4, text: "야간은 손님 적을 땐 편한데, 진열/청소가 몰리면 바빠요. 그래도 급여는 제때." },
  { id: "r4", jobId: "j4", name: "주말알바", stars: 5, text: "서빙 동선 좋고, 사장님이 팁도 챙겨주셔서 만족했어요." },
  { id: "r5", jobId: "j6", name: "마감장인", stars: 4, text: "마감 루틴이 체계적이라 좋습니다. 늦게 끝나도 택시비 지원은 아니라서 참고!" }
];

export const state = {
  category: "전체",
  region: store.get("mg_region", "광주 동구"),
  query: "",
  currentBanner: 0,
  selectedJobId: null,

  // 홈 렌더에서 서버 공고 저장
  jobs: [],

  // 후기 작성 대상
  reviewTargetAppId: null,
  selectedApplicationIdForReview: null,

  // 이력서 화면 모드
  resumeMode: "ME", // "ME" | "APPLICANT"
  viewingResume: null,

  // 사장님 화면에서 필요 시 보관
  ownerJobs: []
};
