// /js/screens/apply.screen.js

import { $ } from "../core/dom.js";
import { state } from "../core/state.js";
import { buildResumeSummaryHTML, formatResumeUpdated } from "../core/utils.js";
import { getMyResume } from "../api/resumes.api.js";
import { createApplication } from "../api/applications.api.js";
import { getMe } from "../api/users.api.js";

let __goto = null;
let __applyBound = false;

function openSimpleApplyForm() {
  $("#apply-simple-form").style.display = "block";

  // users/me에서 자동 채우기
  getMe()
    .then((r) => (r.ok ? r.data : null))
    .then((me) => {
      if (!me) return;
      $("#apply-name").value = me.name ?? "";
      $("#apply-phone").value = me.phone ?? "";
    })
    .catch(() => {});
}

export function initApplyScreen({ goto }) {
  __goto = goto;
  if (__applyBound) return;
  __applyBound = true;

  // 간단 지원 제출(폼)
  $("#btn-submit-apply")?.addEventListener("click", async () => {
    const data = {
      jobId: state.selectedJobId,
      useResume: false,
      name: $("#apply-name").value.trim(),
      phone: $("#apply-phone").value.trim(),
      intro: $("#apply-intro").value.trim(),
      desc: $("#apply-desc").value.trim()
    };

    if (!data.name || !data.phone) {
      alert("이름과 연락처를 입력해주세요.");
      return;
    }

    try {
      await createApplication(data);
      alert("✅ 간단 지원이 완료되었습니다!");
      __goto?.("home");
    } catch (err) {
      console.error(err);
      alert("지원 실패: " + (err?.message || err));
    }
  });
}

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

  // 이력서 조회
  const r = await getMyResume();

  if (r.status === 401) {
    alert("로그인이 필요합니다.");
    __goto?.("login");
    return;
  }

  // 이력서 없음
  if (r.status === 204) {
    $("#apply-no-resume-card").style.display = "block";
    $("#btn-go-resume").onclick = () => __goto?.("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // 기타 실패
  if (!r.ok) {
    console.error("이력서 조회 실패:", r.status, r.text);
    $("#apply-no-resume-card").style.display = "block";
    $("#btn-go-resume").onclick = () => __goto?.("resume");
    $("#btn-apply-simple2").onclick = () => openSimpleApplyForm();
    return;
  }

  // 이력서 있음
  const resume = r.data;
  $("#apply-resume-card").style.display = "block";
  $("#apply-resume-updated").textContent = `마지막 수정: ${formatResumeUpdated(resume?.updatedAt)}`;
  $("#apply-resume-summary").innerHTML = buildResumeSummaryHTML(resume);

  $("#btn-edit-resume").onclick = () => __goto?.("resume");

  $("#btn-apply-with-resume").onclick = async () => {
    if (!confirm("이 공고에 이력서로 지원하시겠습니까?")) return;

    try {
      await createApplication({
        jobId: state.selectedJobId,
        useResume: true
      });
      alert("✅ 지원 완료! 사장님이 확인할 수 있습니다.");
      __goto?.("home");
    } catch (err) {
      console.error(err);
      alert("지원 중 오류가 발생했습니다: " + (err?.message || err));
    }
  };

  // “간단 지원” 버튼이 카드 내부에 있을 수 있으니(있으면) 연결
  $("#btn-apply-simple2") && ($("#btn-apply-simple2").onclick = () => openSimpleApplyForm());
}
