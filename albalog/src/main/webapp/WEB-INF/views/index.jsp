<%@ page contentType="text/html; charset=UTF-8" pageEncoding="UTF-8"%>
<!DOCTYPE html>
<html lang="ko">
<head>
<meta charset="UTF-8" />
<title>믿고 쓰는 알바앱</title>
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<!-- ✅ JSP에서는 contextPath를 붙여서 정적 리소스를 로딩하는 게 안전해요 -->
<link rel="stylesheet" href="/css/style.css">
</head>
<body>
	<div class="app">
		<!-- 헤더 -->
		<header>
			<div class="logo-mark">알</div>
			<div class="logo-text-wrap">
				<div class="logo-main">알바로그</div>
				<div class="logo-sub">검증된 공고만 한 곳에</div>
			</div>
			<div class="header-right">
				<div class="header-pill">실시간 검수 · 안심지원</div>
				<button class="header-btn" id="btn-header-login">로그인</button>
			</div>
		</header>

		<!-- 메인 -->
		<main>
			<!-- 1. 홈 -->
			<section id="screen-home" class="screen active">
				<div class="region-row">
					<div class="trust-badge">
						<b id="current-region-text">광주 전체</b> 기준 추천 알바
					</div>
					<div class="region-pill" id="btn-open-region">
						📍 <span id="region-pill-text">광주 동구</span> ▾
					</div>
				</div>

				<div class="search-box">
					<span>🔍</span> <input type="text" id="search-input"
						placeholder="지역, 가게, 키워드 검색 (데모)" />
				</div>

				<div class="chips" id="category-chips">
					<div class="chip active" data-category="전체">전체</div>
					<div class="chip" data-category="카페">카페</div>
					<div class="chip" data-category="편의점">편의점</div>
					<div class="chip" data-category="식당">식당</div>
					<div class="chip" data-category="의류">의류</div>
					<div class="chip" data-category="신발">신발</div>
					<div class="chip" data-category="주말">주말</div>
				</div>

				<!-- 배너 슬라이더 -->
				<div class="slider-wrapper">
					<div class="slider-banner">
						<div class="banner-slide" data-banner="urgent">
							<div class="banner-title">지금 급구! 오늘 마감 공고</div>
							<div class="banner-desc">오늘 안에 연락 오는 급구 공고만 모았어요.</div>
							<div class="banner-tag">⚡ 3시간 이내 등록</div>
						</div>
						<div class="banner-slide blue" data-banner="highpay">
							<div class="banner-title">시급 11,000원 이상 공고</div>
							<div class="banner-desc">경력있는 알바생을 위한 우대 공고만!</div>
							<div class="banner-tag">💼 프로 알바</div>
						</div>
					</div>
				</div>

				<!-- 급구 공고 -->
				<div class="section-title-row">
					<div>
						<div class="section-title">급구 알바</div>
						<div class="section-sub">오늘 안에 연락 오는 공고</div>
					</div>
				</div>
				<div id="urgent-list"></div>

				<!-- 전체 공고 -->
				<div class="section-title-row" style="margin-top: 14px;">
					<div>
						<div class="section-title">전체 공고</div>
						<div class="section-sub">현재 지역 기준 공고</div>
					</div>
					<div class="link-small" id="btn-scroll-top">맨 위로</div>
				</div>
				<div id="job-list"></div>
			</section>

			<!-- 2. 로그인 -->
			<section id="screen-login" class="screen">
				<div class="screen-title">로그인</div>
				<div class="screen-sub">지원 내역과 찜한 공고를 한 번에 관리하세요.</div>

				<div class="input-group">
					<label>아이디</label> <input type="text" id="login-id"
						placeholder="아이디를 입력하세요" />
				</div>
				<div class="input-group">
					<label>비밀번호</label> <input type="password" id="login-pw"
						placeholder="비밀번호를 입력하세요" />
				</div>

				<button class="btn primary" id="btn-login">로그인</button>
				<button class="btn secondary" id="btn-go-signup">회원가입</button>
				<button class="btn outline" data-goto="home">← 홈으로</button>
			</section>

			<!-- 3. 회원가입 -->
			<section id="screen-signup" class="screen">
				<div class="screen-title">회원가입</div>
				<div class="screen-sub">1분만 투자하면 매번 정보 입력 없이 빠르게 지원할 수 있어요.</div>

				<div class="input-group">
					<label>아이디</label> <input type="text" id="signup-id"
						placeholder="영문·숫자 조합" />
				</div>
				<div class="input-group">
					<label>비밀번호</label> <input type="password" id="signup-pw"
						placeholder="8자 이상" />
				</div>
				<div class="input-group">
					<label>이메일</label> <input type="email" id="signup-email"
						placeholder="example@email.com" />
				</div>
				<div class="input-group">
					<label>이름</label> <input type="text" id="signup-name"
						placeholder="실명을 입력하세요" />
				</div>
				<div class="input-group">
					<label>생년월일</label> <input type="date" id="signup-birth" />
				</div>
				<div class="input-group">
					<label>전화번호</label> <input type="tel" id="signup-phone"
						placeholder="010-1234-5678" maxlength="13" />
				</div>

				<div class="input-group">
					<label class="check-row" for="signup-owner"> <span
						class="check-text">사장님입니다</span> <input type="checkbox"
						id="signup-owner" />
					</label>
				</div>


				<button class="btn primary" id="btn-signup-complete">가입하기</button>
				<button class="btn outline" data-goto="login">← 로그인으로</button>
			</section>

			<!-- 4. 공고 상세 -->
			<section id="screen-detail" class="screen">
				<div class="screen-title" id="detail-title">공고 제목</div>
				<div class="screen-sub" id="detail-company">가게 이름</div>

				<div class="detail-pay" id="detail-pay">시급 정보</div>
				<div class="detail-meta" id="detail-time">근무 시간</div>
				<div class="detail-meta" id="detail-region">근무 지역</div>

				<div class="detail-desc" id="detail-desc">공고 설명</div>

				<div class="detail-reviews">
					<div class="section-title-row">
						<div class="section-title">알바 후기</div>
						<div class="section-sub" id="detail-review-info">평점 정보</div>
					</div>
					<div id="detail-review-list"></div>
				</div>

				<button class="btn primary" id="btn-apply">이 공고에 지원하기</button>
				<button class="btn secondary" id="btn-goto-myjobs">내 지원 내역
					보기</button>
				<button class="btn outline" data-goto="home">← 공고 목록으로</button>
			</section>

			<!-- 5. 지원서 작성 -->
			<section id="screen-apply" class="screen">
				<div class="screen-title">지원서 작성</div>
				<div class="screen-sub" id="apply-job-title">지원할 공고 정보</div>

				<!-- =====================
       지원 방식 선택
  ====================== -->
				<div class="block-title">지원 방식</div>

				<!-- ✅ 이력서 있음 -->
				<div class="card" id="apply-resume-card" style="display: none;">
					<div class="row"
						style="justify-content: space-between; align-items: center;">
						<div>
							<div style="font-weight: 700;">저장된 이력서로 지원</div>
							<div class="muted" id="apply-resume-updated">마지막 수정: -</div>
						</div>
						<button type="button" class="btn small" id="btn-edit-resume">
							이력서 보기/수정</button>
					</div>

					<div class="mini" id="apply-resume-summary"
						style="margin-top: 10px;"></div>

					<div class="row" style="margin-top: 10px; gap: 8px;">
						<button type="button" class="btn primary flex1"
							id="btn-apply-with-resume">이력서로 지원하기</button>
						<button type="button" class="btn outline flex1"
							id="btn-apply-simple">간단 지원하기</button>
					</div>
				</div>

				<!-- ✅ 이력서 없음 -->
				<div class="card" id="apply-no-resume-card" style="display: none;">
					<div style="font-weight: 700;">저장된 이력서가 없어요</div>
					<div class="muted" style="margin-top: 6px;">이력서를 작성하면 다음부터는
						빠르게 지원할 수 있어요.</div>

					<div class="row" style="margin-top: 10px; gap: 8px;">
						<button type="button" class="btn primary flex1" id="btn-go-resume">
							이력서 작성하러 가기</button>
						<button type="button" class="btn outline flex1"
							id="btn-apply-simple2">이력서 없이 지원</button>
					</div>
				</div>

				<!-- =====================
       ✅ 간단 지원 폼
       (처음엔 숨김)
  ====================== -->
				<div id="apply-simple-form" style="display: none; margin-top: 16px;">
					<div class="input-group">
						<label>이름</label> <input type="text" id="apply-name"
							placeholder="실명 입력" />
					</div>

					<div class="input-group">
						<label>연락처</label> <input type="text" id="apply-phone"
							placeholder="010-0000-0000" />
					</div>

					<div class="input-group">
						<label>한 줄 소개</label> <input type="text" id="apply-intro"
							placeholder="예) 책임감 있게 성실히 일하겠습니다." />
					</div>

					<div class="input-group">
						<label>자기소개 / 경력</label>
						<textarea id="apply-desc" placeholder="간단한 경력과 자기소개를 적어주세요."></textarea>
					</div>

					<button class="btn primary" id="btn-submit-apply">지원서 보내기
					</button>
				</div>

				<button class="btn outline" data-goto="detail">← 공고 상세로</button>
			</section>


			<!-- 6. 공고 올리기 -->
			<!-- 6. 공고 올리기 (사장님) -->
			<section id="screen-post" class="screen">
				<div class="screen-title">공고 올리기</div>
				<div class="screen-sub">필수 항목만 채우면 바로 등록돼요.</div>

				<div class="input-group">
					<label>가게 이름</label> <input type="text" id="post-company"
						placeholder="예) 감성카페 오동도점" />
				</div>

				<div class="input-group">
					<label>공고 제목</label> <input type="text" id="post-title"
						placeholder="예) 카페 알바 (바리스타)" />
				</div>

				<!-- 시급 -->
				<div class="input-group">
					<label>시급</label>

					<div class="segmented" id="pay-mode">
						<button type="button" class="seg-btn active" data-mode="amount">금액</button>
						<button type="button" class="seg-btn" data-mode="negotiable">협의</button>
					</div>

					<div class="row" id="pay-amount-row">
						<input type="number" id="post-pay" placeholder="예) 10000"
							min="9860" /> <span class="suffix">원</span>
					</div>
					<div class="helper" id="pay-helper">최저시급 10,030원 미만은 설정할 수
						없어요.</div>
				</div>

				<!-- 근무 요일 -->
				<div class="input-group">
					<label>근무 요일</label>

					<div class="segmented" id="days-quick">
						<button type="button" class="seg-btn" data-quick="weekdays">주중</button>
						<button type="button" class="seg-btn" data-quick="weekend">주말</button>
						<button type="button" class="seg-btn" data-quick="all">전체</button>
						<button type="button" class="seg-btn" data-quick="clear">초기화</button>
						<button type="button" class="seg-btn" data-quick="negotiable">협의</button>
					</div>

					<div class="day-grid" id="post-days">
						<button type="button" class="day" data-day="MON">월</button>
						<button type="button" class="day" data-day="TUE">화</button>
						<button type="button" class="day" data-day="WED">수</button>
						<button type="button" class="day" data-day="THU">목</button>
						<button type="button" class="day" data-day="FRI">금</button>
						<button type="button" class="day" data-day="SAT">토</button>
						<button type="button" class="day" data-day="SUN">일</button>
					</div>

					<div class="helper" id="days-helper">요일을 선택하거나 “협의”를 선택할 수
						있어요.</div>
				</div>

				<!-- 근무 시간 -->
				<div class="input-group">
					<label>근무 시간</label>

					<div class="segmented" id="time-mode">
						<button type="button" class="seg-btn active" data-mode="select">선택</button>
						<button type="button" class="seg-btn" data-mode="custom">직접입력</button>
						<button type="button" class="seg-btn" data-mode="negotiable">협의</button>
					</div>

					<!-- 선택 모드(15분 단위) -->
					<div class="row" id="time-select-row">
						<select id="post-start"></select> <span class="dash">~</span> <select
							id="post-end"></select> <select id="time-step" class="step">
							<option value="15">15분</option>
							<option value="30" selected>30분</option>
							<option value="60">60분</option>
						</select>
					</div>

					<!-- 직접 입력 모드 -->
					<div class="row" id="time-custom-row" style="display: none;">
						<input type="time" id="post-start-custom" step="900" /> <span
							class="dash">~</span> <input type="time" id="post-end-custom"
							step="900" />
					</div>

					<div class="helper" id="time-helper">시간은 선택/직접입력/협의 중 하나로
						설정해요.</div>
				</div>




				<!-- 근무지역 -->
				<div class="input-group">
					<label>근무 지역</label>
					<div class="row">
						<select id="post-city">
							<option value="">시/도</option>
							<option value="광주">광주</option>
						</select> <select id="post-district">
							<option value="">구/군</option>
							<option value="서구">서구</option>
							<option value="남구">남구</option>
						</select>
					</div>
					<input type="text" id="post-address"
						placeholder="상세 위치(선택) 예) 충장로 1가" />
				</div>

				<!-- 설명 -->
				<div class="input-group">
					<label>간단 설명</label>
					<textarea id="post-desc" maxlength="500"
						placeholder="업무 내용, 우대사항 등을 적어주세요. (최대 500자)"></textarea>
				</div>

				<!-- 이미지 -->
				<div class="input-group">
					<label>이미지(선택)</label> <input type="file" id="post-images"
						accept="image/*" multiple />
					<div class="img-preview" id="post-img-preview"></div>
				</div>

				<button class="btn primary" id="btn-post-submit">공고 등록하기</button>
				<button class="btn outline" data-goto="home">← 홈으로</button>
			</section>


			<!-- 7. 이력서 -->
			<section id="screen-resume" class="screen">
				<div class="screen-title">나의 이력서</div>


				<div class="row">
					<div class="input-group flex1">
						<label>이름</label> <input type="text" id="resume-name" readonly />
					</div>

					<div class="input-group flex1">
						<label>나이</label> <input type="text" id="resume-age" readonly />
					</div>
				</div>

				<div class="input-group">
					<label>전화번호</label> <input type="text" id="resume-phone" readonly />
				</div>



				<!-- 희망 근무 조건 -->
				<div class="block-title">희망 근무 조건</div>

				<div class="input-group">
					<label>희망 시급</label>
					<div class="row">
						<input type="number" id="resume-wage" name="desiredWage"
							placeholder="예) 12000" min="0" /> <label class="inline">
							<input type="checkbox" id="resume-wage-neg" name="wageNegotiable" />
							협의
						</label>
					</div>
				</div>

				<div class="input-group">
					<label>근무 요일</label>

					<div class="day-grid" id="resume-days">
						<button type="button" class="day" data-day="MON">월</button>
						<button type="button" class="day" data-day="TUE">화</button>
						<button type="button" class="day" data-day="WED">수</button>
						<button type="button" class="day" data-day="THU">목</button>
						<button type="button" class="day" data-day="FRI">금</button>
						<button type="button" class="day" data-day="SAT">토</button>
						<button type="button" class="day" data-day="SUN">일</button>
					</div>

					<div class="segmented">
						<button type="button" class="seg-btn" data-mode="negotiable"
							id="resume-days-neg">요일 협의</button>
					</div>
				</div>


				<div class="input-group">
					<label>근무 시간</label>
					<div class="row">
						<input type="time" id="resume-time-start" name="timeStart" /> <span
							class="tilde">~</span> <input type="time" id="resume-time-end"
							name="timeEnd" /> <label class="inline"> <input
							type="checkbox" id="resume-time-neg" name="timeNegotiable" /> 시간
							협의
						</label>
					</div>
				</div>

				<!-- 자기소개 -->
				<div class="block-title">자기소개</div>
				<div class="input-group">
					<label>한 줄/짧은 소개</label>
					<textarea id="resume-intro" name="introduction" rows="4"
						placeholder="예) 시간 약속 철저하고 장기 근무 가능합니다. 손님 응대 자신 있어요!"></textarea>
				</div>

				<!-- 경력 -->
				<div class="block-title">
					경력
					<button type="button" class="btn small" id="btn-add-exp">+
						경력 추가</button>
				</div>

				<div id="exp-list">
					<!-- 기본 1개 -->
					<div class="exp-item">
						<div class="row">
							<div class="input-group flex1">
								<label>근무처(가게명)</label> <input type="text" class="exp-store"
									name="expStore" placeholder="예) 스타카페 광주점" />
							</div>
							<div class="input-group flex1">
								<label>업종</label> <input type="text" class="exp-industry"
									name="expIndustry" placeholder="예) 카페, 편의점" />
							</div>
						</div>

						<div class="row">
							<div class="input-group flex1">
								<label>근무 기간</label> <input type="text" class="exp-period"
									name="expPeriod" placeholder="예) 2024.03 ~ 2024.09 / 6개월" />
							</div>
							<div class="input-group flex1">
								<label>역할</label> <input type="text" class="exp-role"
									name="expRole" placeholder="예) 음료 제조, 서빙, 마감" />
							</div>
						</div>

						<button type="button" class="btn danger small btn-remove-exp">삭제</button>


						<hr class="thin" />
					</div>
				</div>

				<!-- 스킬 -->
				<div class="input-group">
					<label>보유 스킬</label>

					<div class="segmented" id="resume-skills">
						<button type="button" class="seg-btn" data-skill="POS">POS
							사용</button>
						<button type="button" class="seg-btn" data-skill="SERVING">서빙</button>
						<button type="button" class="seg-btn" data-skill="KITCHEN">주방보조</button>
						<button type="button" class="seg-btn" data-skill="CASHIER">계산/캐셔</button>
						<button type="button" class="seg-btn" data-skill="CLOSING">마감</button>
						<button type="button" class="seg-btn" data-skill="CS">고객응대</button>
					</div>
				</div>

				<div class="screen-title">
					<button class="btn primary" id="btn-back-applicants"
						data-goto="applicants">← 목록</button>
				</div>
				<!-- 저장 -->
				<button class="btn primary" id="btn-save-resume">이력서 저장하기</button>
			</section>


			<!-- 8. 프로필 -->
			<section id="screen-profile" class="screen">
				<div class="screen-title">내 프로필</div>
				<div class="screen-sub">사장님에게 보여질 기본 정보입니다. (브라우저 임시 저장)</div>

				<div class="input-group">
					<label>닉네임</label> <input type="text" id="profile-nick"
						placeholder="예) 열정알바생" />
				</div>
				<div class="input-group">
					<label>사는 지역</label> <input type="text" id="profile-area"
						placeholder="예) 광주 동구" />
				</div>
				<div class="input-group">
					<label>한 줄 소개</label> <input type="text" id="profile-intro"
						placeholder="예) 웃으면서 일하는 알바생입니다." />
				</div>

				<button class="btn primary" id="btn-save-profile">프로필 저장하기</button>
				<button class="btn outline" id="btn-logout">로그아웃</button>
			</section>

			<!-- 9. 메시지 -->
			<section id="screen-messages" class="screen">
				<div class="screen-title">메시지</div>
				<div class="screen-sub">지원한 공고에 대한 사장님 답장이 도착합니다. (데모)</div>

				<div id="message-list"></div>

				<button class="btn outline" id="btn-dummy-msg">테스트 메시지 추가</button>
			</section>

			<!-- 10. 내 지원 공고 -->
			<section id="screen-myjobs" class="screen">

				<div class="screen-title">내가 지원한 공고</div>
				<div class="screen-sub">최근에 지원한 공고들과 사장님 후기를 한 곳에서 확인할 수 있습니다.</div>

				<!-- ✅ 받은 후기 섹션 (지원내역 상단) -->
				<div id="review-section" class="review-section">
					<div class="block-title">💬 사장님 후기</div>
					<div id="review-list">
						<p class="empty">아직 후기가 없습니다.</p>
					</div>
					<hr class="thin" />
				</div>

				<!-- ✅ 지원내역 리스트 -->
				<div id="myjobs-list"></div>

			</section>

			<!-- 11. 알바 후기 리스트 -->
			<section id="screen-reviews" class="screen">
				<div class="screen-title">알바 후기</div>
				<div class="screen-sub">실제 알바생들이 남긴 후기입니다. (데모)</div>
				<div id="review-list"></div>
			</section>

			<!-- ✅ 사장님: 공고관리 -->
			<!-- ✅ 사장님: 공고관리 -->
			<section id="screen-owner" class="screen">
				<div class="screen-title">공고관리</div>
				<div class="screen-sub">내 공고를 등록하고, 지원자를 확인할 수 있어요.</div>

				<div style="display: flex; gap: 10px; margin-top: 12px;">
					<button class="btn primary" id="btn-owner-go-post">공고 올리기</button>
				</div>

				<div class="section-title-row" style="margin-top: 14px;">
					<div>
						<div class="section-title">내 공고 목록</div>
						<div class="section-sub">등록한 공고를 관리하세요.</div>
					</div>
				</div>

				<div id="owner-job-list"></div>
			</section>


			<!-- ✅ 사장님: 지원자 목록 화면 -->
			<section id="screen-applicants" class="screen">
				<div class="screen-title">지원자 목록</div>
				<div class="screen-sub">공고별 지원자 정보를 확인하세요.</div>

				<div id="applicants-list"></div>

				<button class="btn outline" data-goto="owner">← 내 공고 목록으로</button>
			</section>


		</main>

		<!-- 하단 네비 -->
		<nav class="bottom-nav">

			<div class="nav-item active" data-target="home" id="nav-home">
				<span>🏠</span>
				<div>홈</div>
			</div>

			<!-- 알바생 전용 -->
			<div class="nav-item" data-target="myjobs" id="nav-myjobs"
				style="display: none;">
				<span>📌</span>
				<div>지원내역</div>
			</div>

			<div class="nav-item" data-target="resume" id="nav-resume"
				style="display: none;">
				<span>📄</span>
				<div>이력서</div>
			</div>

			<!-- ✅ 사장님 전용: 공고관리 -->
			<div class="nav-item" data-target="owner" id="nav-owner"
				style="display: none;">
				<span>🧾</span>
				<div>공고관리</div>
			</div>

			<div class="nav-item" data-target="messages" id="nav-messages">
				<span>💬</span>
				<div>메시지</div>
			</div>

		</nav>


		<!-- 지역 선택 바텀시트 -->
		<div class="region-sheet-backdrop" id="region-sheet-backdrop">
			<div class="region-sheet">
				<div class="sheet-handle"></div>
				<div class="sheet-title">지역 선택</div>
				<div class="sheet-sub">지역을 선택하면 해당 지역 공고만 보여드려요.</div>

				<div class="region-group">
					<div class="region-group-title">광주</div>
					<div class="region-chip-row">
						<button class="region-chip" data-region="광주 전체">광주 전체</button>
						<button class="region-chip" data-region="광주 동구">동구</button>
						<button class="region-chip" data-region="광주 서구">서구</button>
						<button class="region-chip" data-region="광주 남구">남구</button>
						<button class="region-chip" data-region="광주 북구">북구</button>
						<button class="region-chip" data-region="광주 광산구">광산구</button>
					</div>
				</div>

				<div class="region-group">
					<div class="region-group-title">서울</div>
					<div class="region-chip-row">
						<button class="region-chip" data-region="서울 전체">전체</button>
						<button class="region-chip" data-region="서울 강남구">강남구</button>
						<button class="region-chip" data-region="서울 마포구">마포구</button>
						<button class="region-chip" data-region="서울 송파구">송파구</button>
					</div>
				</div>

				<div class="region-group">
					<div class="region-group-title">기타</div>
					<div class="region-chip-row">
						<button class="region-chip" data-region="부산 전체">부산</button>
						<button class="region-chip" data-region="대전 전체">대전</button>
						<button class="region-chip" data-region="대구 전체">대구</button>
					</div>
				</div>

				<button class="btn outline" id="btn-close-region">닫기</button>
			</div>
		</div>

		<!-- 모달 컨테이너 -->
		<div id="modal-container" class="modal-container"></div>

		<!-- ✅ 12. 후기 작성 화면 (NEW) -->
		<section id="screen-review-write" class="screen">
			<div class="screen-title">후기 작성</div>
			<div class="screen-sub" id="review-write-sub">채용된 알바생에게 후기를
				남겨주세요.</div>

			<div class="card">
				<div class="input-group">
					<label>별점</label>

					<div class="star-rating" id="review-rating">
						<!-- 5 → 0.5 역순 (CSS 처리 편하게) -->
						<input type="radio" id="star5" name="rating" value="5.0" /> <label
							for="star5" title="5점"></label> <input type="radio"
							id="star4half" name="rating" value="4.5" /> <label
							for="star4half" class="half" title="4.5점"></label> <input
							type="radio" id="star4" name="rating" value="4.0" /> <label
							for="star4" title="4점"></label> <input type="radio"
							id="star3half" name="rating" value="3.5" /> <label
							for="star3half" class="half" title="3.5점"></label> <input
							type="radio" id="star3" name="rating" value="3.0" /> <label
							for="star3" title="3점"></label> <input type="radio"
							id="star2half" name="rating" value="2.5" /> <label
							for="star2half" class="half" title="2.5점"></label> <input
							type="radio" id="star2" name="rating" value="2.0" /> <label
							for="star2" title="2점"></label> <input type="radio"
							id="star1half" name="rating" value="1.5" /> <label
							for="star1half" class="half" title="1.5점"></label> <input
							type="radio" id="star1" name="rating" value="1.0" /> <label
							for="star1" title="1점"></label> <input type="radio"
							id="star0half" name="rating" value="0.5" /> <label
							for="star0half" class="half" title="0.5점"></label>
					</div>
				</div>


				<div class="input-group">
					<label>코멘트</label>
					<textarea id="review-comment" placeholder="예) 성실하고 시간 약속을 잘 지켜요."></textarea>
				</div>

				<button class="btn primary" id="btn-submit-review">후기 등록</button>
				<button class="btn outline" id="btn-cancel-review">← 지원자
					목록으로</button>
			</div>
		</section>

		<!-- 12. 채팅 (NEW) -->
		<section id="screen-chat" class="screen">
			<div class="screen-title" id="chat-title">채팅</div>
			<div class="screen-sub" id="chat-sub">채용된 지원자와만 대화할 수 있어요.</div>

			<!-- ✅ 메시지 리스트 -->
			<div id="chat-list" class="chat-list"></div>

			<!-- ✅ 입력 영역 -->
			<div class="chat-input-bar">
				<input type="text" id="chat-input" placeholder="메시지를 입력하세요" />
				<button class="btn primary" id="btn-chat-send">전송</button>
			</div>


			<button class="btn outline" id="btn-chat-back">← 뒤로</button>
		</section>


		<script src="https://cdn.jsdelivr.net/npm/sweetalert2@11"></script>


		<script
			src="https://cdn.jsdelivr.net/npm/sockjs-client@1/dist/sockjs.min.js"></script>
		<script
			src="https://cdn.jsdelivr.net/npm/stompjs@2.3.3/lib/stomp.min.js"></script>

		<!-- ✅ JS도 contextPath 붙여서 로딩 -->
		<script type="module" src="/js/app.js"></script>
</body>
</html>
