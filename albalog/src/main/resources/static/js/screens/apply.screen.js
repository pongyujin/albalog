// /js/screens/apply.screen.js

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { buildResumeSummaryHTML, formatResumeUpdated } from "../core/utils.js";
import { getMyResume } from "../api/resumes.api.js";
import { createApplication } from "../api/applications.api.js";
import { getMe } from "../api/users.api.js";

let __goto = null;
let __applyBound = false;

/**
 * ✅ 간단 지원 폼 열기 + users/me로 자동 채우기
 */
function openSimpleApplyForm() {
  // 간단지원 폼 표시
  $("#apply-simple-form").style.display = "block";

  // users/me에서 자동 채우기
  getMe()
    .then((r) => (r.ok ? r.data : null))
    .then((me) => {
      if (!me) return;
      $("#apply-name").value = me.name ?? "";
      $("#apply-phone").value = me.phone ?? "";
    })
    .catch(() => {
      // 자동 채우기 실패는 UX에 치명적이지 않으므로 조용히 무시
    });
}

/**
 * ✅ 화면 초기화(이벤트 바인딩 1회)
 */
export function initApplyScreen({ goto }) {
  __goto = goto;
  if (__applyBound) return;
  __applyBound = true;

  // =====================================================
  // 간단 지원 제출(폼)
  // =====================================================
  $("#btn-submit-apply")?.addEventListener("click", async () => {
    const data = {
      jobId: state.selectedJobId,
      useResume: false,
      name: $("#apply-name").value.trim(),
      phone: $("#apply-phone").value.trim(),
      intro: $("#apply-intro").value.trim(),
      desc: $("#apply-desc").value.trim()
    };

    // ✅ 필수값 검증
    if (!data.name || !data.phone) {
      await Swal.fire({
        icon: "warning",
        title: "입력 확인",
        text: "이름과 연락처를 입력해주세요.",
        confirmButtonText: "확인"
      });
      return;
    }

    try {
      // ✅ 로딩 표시
      Swal.fire({
        title: "지원 중...",
        text: "잠시만 기다려주세요.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await createApplication(data);

      // ✅ 로딩 닫기
      Swal.close();

      // ✅ 성공 알림
      await Swal.fire({
        icon: "success",
        title: "지원 완료",
        text: "간단 지원이 완료되었습니다.",
        confirmButtonText: "확인"
      });

      __goto?.("home");
    } catch (err) {
      console.error(err);

      // 로딩이 떠있을 수 있으니 닫기
      Swal.close();

      await Swal.fire({
        icon: "error",
        title: "지원 실패",
        text: "지원 처리 중 오류가 발생했습니다. 다시 시도해주세요.",
        confirmButtonText: "확인"
      });
    }
  });
}

/**
 * ✅ apply 화면 렌더
 * - 이력서 유무에 따라 카드 분기
 */
export async function renderApplyScreen() {
  const job = state.jobs.find((j) => j.id === state.selectedJobId);
  if (!job) {
    __goto?.("home");
    return;
  }

  $("#apply-job-title").textContent = `${job.company} · ${job.title}`;

  // 기본은 숨김
  $("#apply-simple-form").style.display = "none";
  $("#apply-resume-card").style.display = "none";
  $("#apply-no-resume-card").style.display = "none";

  // =====================================================
  // 이력서 조회
  // =====================================================
  let r;
  try {
    // ✅ 로딩 표시
    Swal.fire({
      title: "불러오는 중...",
      text: "이력서 정보를 확인하고 있습니다.",
      allowOutsideClick: false,
      didOpen: () => Swal.showLoading()
    });

    r = await getMyResume();

    // ✅ 로딩 닫기
    Swal.close();
  } catch (err) {
    console.error(err);
    Swal.close();

    await Swal.fire({
      icon: "error",
      title: "불러오기 실패",
      text: "이력서 정보를 불러오는 중 오류가 발생했습니다.",
      confirmButtonText: "확인"
    });

    // 실패 시에도 간단 지원은 열 수 있게 처리
    $("#apply-no-resume-card").style.display = "block";
    $("#btn-go-resume").onclick = () => __goto?.("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // =====================================================
  // 로그인 필요
  // =====================================================
  if (r.status === 401) {
    await Swal.fire({
      icon: "warning",
      title: "로그인이 필요합니다",
      text: "지원하려면 먼저 로그인해주세요.",
      confirmButtonText: "확인"
    });
    __goto?.("login");
    return;
  }

  // =====================================================
  // 이력서 없음(204)
  // =====================================================
  if (r.status === 204) {
    $("#apply-no-resume-card").style.display = "block";

    $("#btn-go-resume").onclick = () => __goto?.("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // =====================================================
  // 기타 실패
  // =====================================================
  if (!r.ok) {
    console.error("이력서 조회 실패:", r.status, r.text);

    await Swal.fire({
      icon: "error",
      title: "이력서 조회 실패",
      text: "이력서 정보를 불러오지 못했습니다. 간단 지원으로 진행할 수 있습니다.",
      confirmButtonText: "확인"
    });

    $("#apply-no-resume-card").style.display = "block";
    $("#btn-go-resume").onclick = () => __goto?.("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // =====================================================
  // 이력서 있음
  // =====================================================
  const resume = r.data;

  $("#apply-resume-card").style.display = "block";
  $("#apply-resume-updated").textContent = `마지막 수정: ${formatResumeUpdated(resume?.updatedAt)}`;
  $("#apply-resume-summary").innerHTML = buildResumeSummaryHTML(resume);

  // 이력서 보기/수정
  $("#btn-edit-resume").onclick = () => __goto?.("resume");

  // =====================================================
  // ✅ 이력서로 지원하기 버튼
  // =====================================================
  $("#btn-apply-with-resume").onclick = async () => {
    // confirm 대체
    const result = await Swal.fire({
      icon: "question",
      title: "이력서로 지원할까요?",
      text: "지원하면 사장님이 이력서를 확인할 수 있습니다.",
      showCancelButton: true,
      confirmButtonText: "지원하기",
      cancelButtonText: "취소",
      confirmButtonColor: "#2ecc71",
      cancelButtonColor: "#b0b0b0"
    });

    if (!result.isConfirmed) return;

    try {
      // 로딩
      Swal.fire({
        title: "지원 중...",
        text: "잠시만 기다려주세요.",
        allowOutsideClick: false,
        didOpen: () => Swal.showLoading()
      });

      await createApplication({
        jobId: state.selectedJobId,
        useResume: true
      });

      Swal.close();

      await Swal.fire({
        icon: "success",
        title: "지원 완료",
        text: "지원이 완료되었습니다. 사장님이 확인할 수 있습니다.",
        confirmButtonText: "확인"
      });

      __goto?.("home");
    } catch (err) {
      console.error(err);
      Swal.close();

      await Swal.fire({
        icon: "error",
        title: "지원 실패",
        text: "지원 중 오류가 발생했습니다. 다시 시도해주세요.",
        confirmButtonText: "확인"
      });
    }
  };

  // “간단 지원” 버튼이 카드 내부에 있을 수 있으니(있으면) 연결
  $("#btn-apply-simple2") && ($("#btn-apply-simple2").onclick = () => openSimpleApplyForm());
}
