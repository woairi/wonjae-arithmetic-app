import {
  DEFAULT_TYPE_ID,
  PLACE_LABELS,
  PRACTICE_TYPES,
  SESSION_TYPE_OPTIONS,
  SESSION_SIZE,
  getPracticeType,
  getSessionType,
  isMixedSessionType
} from "./constants.js";
import {
  createFocusedTypeSession,
  createFreshSession,
  createRetrySession,
  getHintMessage
} from "./problem-engine.js";
import {
  HINT_LEVELS,
  buildHomeRecommendation,
  buildResultRecommendation,
  getBoardFocusText,
  getHintFocusPositions,
  getHintHelperMessage,
  getHintToolbarCopy,
  getTypeAccuracyFromCounts,
  getWeakTypeStats
} from "./learning-support.js";
import {
  clearHistory,
  clearRecentHistory,
  getAccuracy,
  getLastSevenDaySummary,
  getRecentSummary,
  getWeakestTypeIds,
  loadSnapshot,
  recordSession,
  removeHistoryEntry,
  saveSnapshot
} from "./storage.js";

const appRoot = document.querySelector("#app");
const groupedTypes = SESSION_TYPE_OPTIONS.reduce((groups, type) => {
  groups[type.group] ??= [];
  groups[type.group].push(type);
  return groups;
}, {});
const PRACTICE_TYPE_ORDER = PRACTICE_TYPES.map((type) => type.id);
const FULL_PLACE_LABELS = ["천의 자리", "백의 자리", "십의 자리", "일의 자리"];
const GROUP_META = {
  "섞어 풀기": {
    lead: "여러 유형",
    detail: "5개 실제 유형이 섞여 나와요.",
    chip: "랜덤",
    className: "group-mixed"
  },
  덧셈: {
    lead: "더하는 문제",
    detail: "받아올림을 보고 골라요.",
    chip: "+ 덧셈",
    className: "group-addition"
  },
  뺄셈: {
    lead: "빼는 문제",
    detail: "받아내림을 보고 골라요.",
    chip: "- 뺄셈",
    className: "group-subtraction"
  }
};

const state = {
  view: "home",
  selectedTypeId: DEFAULT_TYPE_ID,
  hintLevel: 1,
  snapshot: loadSnapshot(),
  session: null,
  lastResult: null,
  pendingHistoryAction: null
};
let autoAdvanceTimerId = null;

function escapeHtml(text) {
  return String(text)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function formatDate(dateText) {
  if (!dateText) {
    return "아직 학습 기록이 없어요.";
  }

  return new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    hour: "numeric",
    minute: "numeric"
  }).format(new Date(dateText));
}

function clearAutoAdvanceTimer() {
  if (autoAdvanceTimerId) {
    clearTimeout(autoAdvanceTimerId);
    autoAdvanceTimerId = null;
  }
}

function getCurrentProblem() {
  return state.session?.problems[state.session.currentIndex] ?? null;
}

function getSessionDisplayLabel(sessionLike) {
  return sessionLike?.sessionLabel ?? getSessionMeta(sessionLike).label;
}

function getSessionMeta(sessionLike) {
  if (sessionLike?.sessionMeta) {
    return sessionLike.sessionMeta;
  }

  return getSessionType(sessionLike?.sessionTypeId ?? DEFAULT_TYPE_ID);
}

function clearPendingHistoryAction() {
  state.pendingHistoryAction = null;
}

function getSortedTypeEntries(typeCounts) {
  return PRACTICE_TYPE_ORDER.filter((typeId) => typeCounts[typeId]).map((typeId) => [
    typeId,
    typeCounts[typeId]
  ]);
}

function countProblemsByType(problems) {
  return problems.reduce((counts, problem) => {
    counts[problem.typeId] = (counts[problem.typeId] ?? 0) + 1;
    return counts;
  }, {});
}

function collectPerTypeStats(problems) {
  const statsByType = {};

  problems.forEach((problem) => {
    statsByType[problem.typeId] ??= {
      typeId: problem.typeId,
      totalAnswered: 0,
      totalCorrect: 0
    };

    statsByType[problem.typeId].totalAnswered += 1;
    if (problem.isCorrect) {
      statsByType[problem.typeId].totalCorrect += 1;
    }
  });

  return Object.values(statsByType);
}

function formatTypeCountText(typeCounts) {
  const entries = getSortedTypeEntries(typeCounts);

  if (entries.length === 0) {
    return "없음";
  }

  return entries
    .map(([typeId, count]) => `${getPracticeType(typeId).label} ${count}문제`)
    .join(" · ");
}

function getHistoryModeLabel(entry) {
  if (entry.source === "retry") {
    return "틀린 문제 다시";
  }

  if (entry.source === "focus-types") {
    return entry.focusedTypeIds.length > 1 ? "틀린 유형만 다시" : "같은 유형 다시";
  }

  return isMixedSessionType(entry.sessionTypeId) ? "혼합 모드" : "새 문제";
}

function renderTypePills(typeCounts, emptyMessage) {
  const entries = getSortedTypeEntries(typeCounts);

  if (entries.length === 0) {
    return `<p class="small-note">${emptyMessage}</p>`;
  }

  return `
    <div class="type-pill-list">
      ${entries
        .map(([typeId, count]) => `<span class="type-pill">${getPracticeType(typeId).label} ${count}</span>`)
        .join("")}
    </div>
  `;
}

function renderAccuracySummary(snapshot) {
  const attemptedTypes = PRACTICE_TYPES.filter(
    (type) => snapshot.stats[type.id]?.totalAnswered > 0
  );

  if (attemptedTypes.length === 0) {
    return `<p class="small-note">아직 유형별 기록이 없어요.</p>`;
  }

  return `
    <div class="summary-list">
      ${attemptedTypes
        .map((type) => {
          const stat = snapshot.stats[type.id];

          return `
            <div class="summary-row">
              <span>${type.label}</span>
              <strong>${getAccuracy(stat)}%</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function getTypeLabel(typeId, emptyLabel = "아직 없음") {
  return typeId ? getPracticeType(typeId).label : emptyLabel;
}

function renderWeeklySummaryCard(summary, options = {}) {
  const {
    title = "최근 7일 요약",
    helperCopy = "숫자 먼저 보고 다음 연습을 고르기 좋아요."
  } = options;

  return `
    <article class="info-card guardian-card weekly-summary-card">
      <p class="card-label">${title}</p>
      <strong>${summary.practiceCount > 0 ? `${summary.practiceCount}회 연습` : "최근 기록 없음"}</strong>
      <p>${helperCopy}</p>
      <div class="summary-list">
        <div class="summary-row">
          <span>연습 횟수</span>
          <strong>${summary.practiceCount}회</strong>
        </div>
        <div class="summary-row">
          <span>가장 많이 푼 유형</span>
          <strong>${getTypeLabel(summary.mostPracticedTypeId)}</strong>
        </div>
        <div class="summary-row">
          <span>가장 많이 틀린 유형</span>
          <strong>${getTypeLabel(summary.mostWrongTypeId)}</strong>
        </div>
        <div class="summary-row">
          <span>평균 정확도</span>
          <strong>${summary.averageAccuracy ?? "-"}${summary.averageAccuracy !== null ? "%" : ""}</strong>
        </div>
      </div>
    </article>
  `;
}

function getActionSignature(action) {
  return [
    action.action,
    action.typeId ?? "",
    Array.isArray(action.typeIds) ? action.typeIds.join(",") : ""
  ].join("|");
}

function renderActionButton(action, className = "secondary-button", options = {}) {
  const { autofocus = false } = options;

  return `
    <button
      class="${className}"
      data-action="${action.action}"
      ${action.typeId ? `data-type-id="${action.typeId}"` : ""}
      ${action.typeIds?.length ? `data-type-ids="${action.typeIds.join(",")}"` : ""}
      ${autofocus ? 'data-autofocus="true"' : ""}
    >
      ${action.label}
    </button>
  `;
}

function renderWeakTypeReview(typeStats) {
  if (typeStats.length === 0) {
    return `<p class="small-note">이번 세션에서는 다시 볼 유형이 없어요.</p>`;
  }

  return `
    <div class="summary-list">
      ${typeStats
        .map((typeStat) => {
          const practiceType = getPracticeType(typeStat.typeId);
          const wrongCount = typeStat.totalAnswered - typeStat.totalCorrect;

          return `
            <div class="summary-row">
              <span>${practiceType.label}</span>
              <strong>${getTypeAccuracyFromCounts(typeStat)}% · ${wrongCount}개 틀림</strong>
            </div>
          `;
        })
        .join("")}
    </div>
  `;
}

function getHistoryActionSummary(action) {
  if (!action) {
    return null;
  }

  switch (action.kind) {
    case "clear-recent":
      return {
        title: "최근 7일 기록 지우기",
        message:
          "최근 7일 연습 기록과 최근 7일 요약을 지웁니다. 남는 기록만 다시 계산해 보여줘요.",
        confirmLabel: "최근 7일 기록 지우기"
      };
    case "clear-all":
      return {
        title: "전체 기록 지우기",
        message:
          "저장된 모든 연습 기록과 누적 정확도를 모두 지웁니다. 앱이 처음 상태로 돌아갑니다.",
        confirmLabel: "전체 기록 지우기"
      };
    case "delete-session":
      return {
        title: "이 세션 삭제",
        message:
          "이 연습 기록 하나만 지웁니다. 남은 기록 기준으로 정확도와 요약을 다시 계산합니다.",
        confirmLabel: "이 세션 삭제"
      };
    default:
      return null;
  }
}

function renderHistoryActionConfirm(action, options = {}) {
  const summary = getHistoryActionSummary(action);
  if (!summary) {
    return "";
  }

  const { inline = false } = options;

  return `
    <div class="danger-confirm ${inline ? "danger-confirm-inline" : ""}">
      <p class="card-label">${summary.title}</p>
      <strong>${summary.title}</strong>
      <p>${summary.message}</p>
      <div class="inline-actions">
        <button class="ghost-button wide-button" data-action="cancel-history-action" data-autofocus="true">
          취소
        </button>
        <button class="danger-button wide-button" data-action="confirm-history-action">
          ${summary.confirmLabel}
        </button>
      </div>
    </div>
  `;
}

function createSessionResult(session) {
  const correctCount = session.problems.filter((problem) => problem.isCorrect).length;
  const wrongProblems = session.problems.filter((problem) => !problem.isCorrect);
  const totalCount = session.problems.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);
  const typeBreakdown = countProblemsByType(session.problems);
  const wrongTypeBreakdown = countProblemsByType(wrongProblems);

  return {
    id: crypto.randomUUID(),
    sessionTypeId: session.sessionTypeId,
    typeId: session.sessionTypeId,
    source: session.source,
    sessionMeta: getSessionMeta(session),
    focusedTypeIds: session.focusedTypeIds ?? [],
    correctCount,
    wrongCount: wrongProblems.length,
    totalCount,
    accuracy,
    wrongProblems,
    wrongTypeIds: Object.keys(wrongTypeBreakdown),
    typeBreakdown,
    wrongTypeBreakdown,
    perTypeStats: collectPerTypeStats(session.problems),
    finishedAt: new Date().toISOString()
  };
}

function startFreshSession(typeId) {
  clearAutoAdvanceTimer();
  clearPendingHistoryAction();
  state.selectedTypeId = typeId;
  state.session = createFreshSession(typeId, SESSION_SIZE);
  state.lastResult = null;
  state.view = "practice";
  render();
}

function startFocusedTypeSession(typeIds) {
  const filteredTypeIds = Array.isArray(typeIds) ? typeIds.filter(Boolean) : [];
  if (filteredTypeIds.length === 0) {
    return;
  }

  clearAutoAdvanceTimer();
  clearPendingHistoryAction();
  state.selectedTypeId = filteredTypeIds[0];
  state.session = createFocusedTypeSession(filteredTypeIds, SESSION_SIZE);
  state.lastResult = null;
  state.view = "practice";
  render();
}

function startRetrySession() {
  if (!state.lastResult || state.lastResult.wrongProblems.length === 0) {
    return;
  }

  clearAutoAdvanceTimer();
  clearPendingHistoryAction();
  state.session = createRetrySession(
    state.lastResult.sessionTypeId,
    state.lastResult.wrongProblems,
    getSessionMeta(state.lastResult)
  );
  state.view = "practice";
  render();
}

function finishSession() {
  clearAutoAdvanceTimer();
  const sessionResult = createSessionResult(state.session);
  state.snapshot = recordSession(state.snapshot, sessionResult);
  saveSnapshot(state.snapshot);

  state.lastResult = sessionResult;
  state.session = null;
  state.view = "result";
  render();
}

function goToNextProblem() {
  if (!state.session) {
    return;
  }

  clearAutoAdvanceTimer();

  if (state.session.currentIndex === state.session.problems.length - 1) {
    finishSession();
    return;
  }

  state.session.currentIndex += 1;
  state.session.validationMessage = "";
  render();
}

function handleAnswerSubmit() {
  const currentProblem = getCurrentProblem();
  if (!currentProblem || currentProblem.submitted) {
    return;
  }

  const trimmedAnswer = currentProblem.inputValue.trim();
  if (!trimmedAnswer) {
    state.session.validationMessage = "답을 써요.";
    render();
    return;
  }

  const numericAnswer = Number(trimmedAnswer);
  if (!Number.isInteger(numericAnswer)) {
    state.session.validationMessage = "숫자만 써요.";
    render();
    return;
  }

  currentProblem.submitted = true;
  currentProblem.isCorrect = numericAnswer === currentProblem.answer;
  currentProblem.feedback = currentProblem.isCorrect
    ? state.session.currentIndex === state.session.problems.length - 1
      ? "맞았어요. 잠깐 뒤 결과를 보여줘요."
      : "맞았어요. 잠깐 뒤 다음 문제로 가요."
    : `정답 ${currentProblem.answer}. ${getHintMessage(currentProblem)}`;
  state.session.validationMessage = "";
  render();
}

function requestHistoryAction(action) {
  state.pendingHistoryAction = action;
  render();
}

function applyHistoryAction() {
  const pendingAction = state.pendingHistoryAction;
  if (!pendingAction) {
    return;
  }

  if (pendingAction.kind === "clear-all") {
    state.snapshot = clearHistory();
  } else if (pendingAction.kind === "clear-recent") {
    state.snapshot = clearRecentHistory(state.snapshot);
  } else if (pendingAction.kind === "delete-session" && pendingAction.entryId) {
    state.snapshot = removeHistoryEntry(state.snapshot, pendingAction.entryId);
  }

  saveSnapshot(state.snapshot);
  clearPendingHistoryAction();
  render();
}

function renderDigitCell(value) {
  return `<span class="digit-cell ${value === " " ? "digit-blank" : ""}">${escapeHtml(value)}</span>`;
}

function renderProblemBoard(problem) {
  const digitCount = Math.max(
    String(problem.left).length,
    String(problem.right).length,
    String(problem.answer).length,
    3
  );
  const placeLabels = PLACE_LABELS.slice(PLACE_LABELS.length - digitCount);
  const fullPlaceLabels = FULL_PLACE_LABELS.slice(FULL_PLACE_LABELS.length - digitCount);
  const leftDigits = String(problem.left).padStart(digitCount, " ").split("");
  const rightDigits = String(problem.right).padStart(digitCount, " ").split("");
  const focusPositions = new Set(getHintFocusPositions(problem, state.hintLevel));
  const showStrongFocus =
    state.hintLevel > 0 && problem.submitted && !problem.isCorrect && focusPositions.size > 0;

  function getFocusClass(index) {
    if (!focusPositions.has(fullPlaceLabels[index])) {
      return "";
    }

    return showStrongFocus ? "place-focus-strong" : "place-focus-soft";
  }

  function renderFocusedDigitCell(value, index) {
    return renderDigitCell(value).replace(
      'class="digit-cell',
      `class="digit-cell ${getFocusClass(index)}`
    );
  }

  return `
    <div class="problem-board ${state.hintLevel > 0 ? "problem-board-hints" : ""} ${showStrongFocus ? "problem-board-wrong-focus" : ""}" style="--digit-columns: ${digitCount}">
      <div class="place-row">
        <span class="operator-space"></span>
        ${placeLabels
          .map(
            (label, index) =>
              `<span class="place-label ${getFocusClass(index)}">${label}</span>`
          )
          .join("")}
      </div>
      <div class="digit-row">
        <span class="operator-space"></span>
        ${leftDigits.map((value, index) => renderFocusedDigitCell(value, index)).join("")}
      </div>
      <div class="digit-row">
        <span class="operator-mark">${problem.operator}</span>
        ${rightDigits.map((value, index) => renderFocusedDigitCell(value, index)).join("")}
      </div>
      <div class="digit-line"></div>
    </div>
  `;
}

function renderHome() {
  const homeRecommendation = buildHomeRecommendation(state.snapshot);
  const weakestTypeIds = getWeakestTypeIds(state.snapshot, 2);
  const weakestTypes = weakestTypeIds.map((typeId) => getPracticeType(typeId));
  const recentSummary = getRecentSummary(state.snapshot);
  const weeklySummary = getLastSevenDaySummary(state.snapshot);
  const recentSessionLabel = recentSummary ? getSessionDisplayLabel(recentSummary) : null;

  return `
    <section class="screen hero-screen">
      <div class="hero-card">
        <p class="eyebrow">원재 연산앱</p>
        <h1>오늘도<br />차근차근 풀어요.</h1>
        <p class="hero-copy">큰 숫자로 보고, 10문제만 풀어요.</p>
        <button class="primary-button" data-action="start-recommended" data-autofocus="true">
          바로 시작
        </button>
      </div>

      <div class="card-grid">
        <article class="info-card accent-card">
          <p class="card-label">오늘 추천</p>
          <strong>${homeRecommendation.title}</strong>
          <p>${homeRecommendation.message}</p>
          <p class="recommend-reason">이유: ${homeRecommendation.reason}</p>
        </article>

        ${renderWeeklySummaryCard(weeklySummary)}

        <article class="info-card">
          <p class="card-label">가장 약한 유형</p>
          <strong>${weakestTypes.length > 0 ? weakestTypes.map((type) => type.label).join(" · ") : "아직 기록 없음"}</strong>
          <p>${weakestTypes.length > 0 ? "여기부터 다시 보면 좋아요." : "처음이면 3자리 덧셈부터 해요."}</p>
        </article>

        <article class="info-card">
          <p class="card-label">최근 학습 기록</p>
          <strong>${recentSummary ? recentSessionLabel : "아직 없음"}</strong>
          <p>${recentSummary ? `${recentSummary.correctCount} / ${recentSummary.totalCount} · ${recentSummary.accuracy}% · ${formatDate(recentSummary.finishedAt)}` : "최근 세션 기록을 여기서 확인해요."}</p>
          <div class="inline-actions">
            <button class="ghost-button wide-button" data-action="open-history">자세히 보기</button>
          </div>
        </article>

        <article class="info-card history-manage-card">
          <p class="card-label">기록 정리</p>
          <strong>${recentSummary ? "최근 기록이나 전체 기록을 정리할 수 있어요." : "기록이 생기면 여기서 정리해요."}</strong>
          <p>보호자 요약과는 분리해서 최근 학습 기록 화면에서 정리할 수 있어요.</p>
          <div class="inline-actions">
            <button class="ghost-button wide-button" data-action="open-history">기록 정리 열기</button>
          </div>
        </article>

        <article class="info-card guardian-card">
          <p class="card-label">누적 정확도</p>
          <strong>유형별 정답률</strong>
          <p>최근 7일 카드와 함께 보면 흐름이 더 잘 보여요.</p>
          ${renderAccuracySummary(state.snapshot)}
        </article>
      </div>

      <div class="home-actions">
        <button class="secondary-button" data-action="open-type-select">유형 고르기</button>
        <button class="ghost-button" data-action="open-history">최근 학습 기록</button>
      </div>
    </section>
  `;
}

function renderTypeSelection() {
  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="go-home">홈</button>
        <span class="top-bar-title">유형 고르기</span>
      </div>

      <header class="section-header">
        <h2>오늘 풀 문제를 골라요.</h2>
        <p>한 가지씩 또는 섞어서 연습해요.</p>
      </header>

      ${Object.entries(groupedTypes)
        .map(
          ([groupName, types]) => `
            <section class="type-group ${GROUP_META[groupName]?.className ?? ""}">
              <div class="type-group-header">
                <div>
                  <p class="group-kicker">${GROUP_META[groupName]?.lead ?? groupName}</p>
                  <h3>${groupName}</h3>
                </div>
                <p>${GROUP_META[groupName]?.detail ?? ""}</p>
              </div>
              <div class="type-list">
                ${types
                  .map(
                    (type) => `
                      <button
                        class="type-card ${GROUP_META[groupName]?.className ?? ""} ${state.selectedTypeId === type.id ? "type-card-active" : ""}"
                        data-action="select-type"
                        data-type-id="${type.id}"
                      >
                        <div class="type-card-top">
                          <span class="type-chip">${GROUP_META[groupName]?.chip ?? groupName}</span>
                          <span class="rule-chip">${type.cardRule}</span>
                        </div>
                        <strong>${type.label}</strong>
                        <span class="type-copy">${type.description}</span>
                      </button>
                    `
                  )
                  .join("")}
              </div>
            </section>
          `
        )
        .join("")}

      <div class="bottom-cta">
        <button class="primary-button" data-action="start-selected" data-autofocus="true">
          이걸로 10문제 풀기
        </button>
      </div>
    </section>
  `;
}

function renderPractice() {
  const currentProblem = getCurrentProblem();
  const sessionType = getSessionMeta(state.session);
  const practiceType = getPracticeType(currentProblem.typeId);
  const sessionGroupMeta = GROUP_META[sessionType.group];
  const problemGroupMeta = GROUP_META[practiceType.group];
  const helperMessage = getHintHelperMessage(currentProblem, state.hintLevel);
  const boardFocusText = currentProblem.submitted && !currentProblem.isCorrect
    ? getBoardFocusText(currentProblem, state.hintLevel, "wrong")
    : getBoardFocusText(currentProblem, state.hintLevel, "look");

  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="open-type-select">유형 바꾸기</button>
        <span class="top-bar-title">문제 풀기</span>
      </div>

      <div class="progress-card">
        <article class="practice-focus ${sessionGroupMeta?.className ?? ""}">
          <div class="type-card-top">
            <span class="type-chip">${sessionGroupMeta?.chip ?? sessionType.group}</span>
            <span class="rule-chip">${sessionType.cardRule}</span>
          </div>
          <strong>${sessionType.label}</strong>
          <p>${sessionType.description}</p>
        </article>
        <article class="count-card">
          <p class="card-label">문제</p>
          <strong>${state.session.currentIndex + 1} / ${state.session.problems.length}</strong>
          <p>지금 ${state.session.currentIndex + 1}번째 문제예요.</p>
        </article>
      </div>

      <div class="problem-card">
        <div class="problem-meta">
          <p class="card-label">이번 문제 실제 유형</p>
          <div class="type-card-top ${problemGroupMeta?.className ?? ""}">
            <span class="type-chip">${problemGroupMeta?.chip ?? practiceType.group}</span>
            <span class="rule-chip">${practiceType.cardRule}</span>
          </div>
          <p class="problem-type-name">${practiceType.label}</p>
          <strong>${currentProblem.left} ${currentProblem.operator} ${currentProblem.right}</strong>
          <p>${practiceType.summary}</p>
        </div>

        <div class="hint-toolbar">
          <div>
            <p class="card-label">세로셈 힌트</p>
            <p class="hint-copy">${getHintToolbarCopy(state.hintLevel)}</p>
          </div>
          <div class="hint-level-row">
            ${HINT_LEVELS.map(
              (level) => `
                <button
                  class="ghost-button hint-level-button ${state.hintLevel === level.value ? "hint-level-active" : ""}"
                  data-action="set-hint-level"
                  data-hint-level="${level.value}"
                >
                  ${level.label}
                </button>
              `
            ).join("")}
          </div>
        </div>

        ${
          state.hintLevel > 0
            ? `<p class="board-focus-note ${currentProblem.submitted && !currentProblem.isCorrect ? "board-focus-note-wrong" : ""}">${boardFocusText}</p>`
            : ""
        }

        ${renderProblemBoard(currentProblem)}

        <form class="answer-form" data-role="answer-form">
          <label for="answer" class="answer-label">답</label>
          <input
            id="answer"
            class="answer-input"
            inputmode="numeric"
            autocomplete="off"
            enterkeyhint="done"
            placeholder="답 쓰기"
            value="${escapeHtml(currentProblem.inputValue)}"
            ${currentProblem.submitted ? "disabled" : ""}
          />
          ${
            state.session.validationMessage
              ? `<p class="validation-message">${state.session.validationMessage}</p>`
              : ""
          }
          ${
            currentProblem.submitted
              ? `<div class="feedback-banner ${currentProblem.isCorrect ? "feedback-correct" : "feedback-wrong"}">${currentProblem.feedback}</div>`
              : `<p class="helper-copy ${state.hintLevel > 0 ? "" : "helper-copy-muted"}">${helperMessage}</p>`
          }
          <button class="primary-button" type="submit" ${currentProblem.submitted ? 'data-autofocus="true"' : ""}>
            ${currentProblem.submitted
              ? currentProblem.isCorrect
                ? state.session.currentIndex === state.session.problems.length - 1
                  ? "지금 결과 보기"
                  : "지금 다음 문제"
                : state.session.currentIndex === state.session.problems.length - 1
                  ? "결과 보기"
                  : "다음 문제"
              : "확인"}
          </button>
          ${
            currentProblem.submitted && currentProblem.isCorrect
              ? `<p class="small-note next-step-note">${
                  state.session.currentIndex === state.session.problems.length - 1
                    ? "자동으로 결과로 넘어가요."
                    : "자동으로 다음 문제로 넘어가요."
                }</p>`
              : ""
          }
        </form>
      </div>
    </section>
  `;
}

function renderHistory() {
  const recentEntries = state.snapshot.history;
  const latestEntry = recentEntries[0] ?? null;
  const weeklySummary = getLastSevenDaySummary(state.snapshot);
  const pendingAction = state.pendingHistoryAction;

  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="go-home">홈</button>
        <span class="top-bar-title">최근 학습 기록</span>
      </div>

      <header class="section-header">
        <h2>최근 학습 기록</h2>
        <p>방금 한 연습과 다시 푼 흐름을 따로 모아봐요.</p>
      </header>

      ${renderWeeklySummaryCard(weeklySummary, {
        helperCopy: "최근 기록 흐름과 함께 보면 어디가 흔들렸는지 바로 보여요."
      })}

      <div class="result-grid">
        <article class="info-card accent-card">
          <p class="card-label">최근 세션 수</p>
          <strong>${recentEntries.length}개</strong>
          <p>${recentEntries.length > 0 ? "최신 20개까지 저장해요." : "아직 저장된 연습이 없어요."}</p>
        </article>

        <article class="info-card">
          <p class="card-label">가장 최근</p>
          <strong>${latestEntry ? `${latestEntry.accuracy}%` : "기록 없음"}</strong>
          <p>${latestEntry ? `${getSessionDisplayLabel(latestEntry)} · ${formatDate(latestEntry.finishedAt)}` : "첫 연습 뒤에 자동으로 보여요."}</p>
        </article>
      </div>

      <section class="result-section">
        <h3>기록 정리</h3>
        <article class="info-card history-manage-card">
          <p class="card-label">보호자용 정리</p>
          <strong>필요한 기록만 지우고 요약을 다시 맞춰요.</strong>
          <p>지우기 전에 한 번 더 확인해서 실수로 기록이 없어지지 않게 했어요.</p>
          <div class="inline-actions">
            <button class="ghost-button wide-button" data-action="request-clear-recent">
              최근 7일 기록 지우기
            </button>
            <button class="danger-button wide-button" data-action="request-clear-all">
              전체 기록 지우기
            </button>
          </div>
          ${
            pendingAction && pendingAction.kind !== "delete-session"
              ? renderHistoryActionConfirm(pendingAction)
              : ""
          }
        </article>
      </section>

      <section class="history-list">
        ${
          recentEntries.length === 0
            ? `<article class="info-card"><p class="card-label">최근 학습 기록</p><strong>아직 없어요</strong><p>유형을 하나 골라 10문제 풀면 여기에 쌓여요.</p></article>`
            : recentEntries
                .map((entry) => {
                  const sessionMeta = getSessionMeta(entry);
                  const groupMeta = GROUP_META[sessionMeta.group];
                  const wrongTypes = Object.keys(entry.wrongTypeBreakdown ?? {}).length;

                  return `
                    <article class="history-card">
                      <div class="history-card-top">
                        <div>
                          <p class="card-label">${formatDate(entry.finishedAt)}</p>
                          <strong>${getSessionDisplayLabel(entry)}</strong>
                        </div>
                        <div class="history-score">
                          <span>정확도</span>
                          <strong>${entry.accuracy}%</strong>
                        </div>
                      </div>

                      <div class="type-card-top ${groupMeta?.className ?? ""}">
                        <span class="type-chip">${groupMeta?.chip ?? sessionMeta.group}</span>
                        <span class="rule-chip">${getHistoryModeLabel(entry)}</span>
                      </div>

                      <p class="history-meta">${entry.correctCount} / ${entry.totalCount} 맞음</p>
                      <p class="history-detail">실제 유형: ${formatTypeCountText(entry.typeBreakdown)}</p>
                      <p class="history-detail">${wrongTypes > 0 ? `틀린 유형: ${formatTypeCountText(entry.wrongTypeBreakdown)}` : "틀린 유형 없이 마쳤어요."}</p>
                      <div class="inline-actions">
                        <button
                          class="ghost-button wide-button"
                          data-action="request-delete-session"
                          data-entry-id="${entry.id}"
                        >
                          이 기록 삭제
                        </button>
                      </div>
                      ${
                        pendingAction?.kind === "delete-session" && pendingAction.entryId === entry.id
                          ? renderHistoryActionConfirm(pendingAction, { inline: true })
                          : ""
                      }
                    </article>
                  `;
                })
                .join("")
        }
      </section>

      <div class="bottom-cta">
        <button class="secondary-button" data-action="open-type-select">유형 고르기</button>
      </div>
    </section>
  `;
}

function renderWrongProblems(result) {
  if (result.wrongProblems.length === 0) {
    return `<p class="small-note">모두 맞았어요.</p>`;
  }

  return `
    <div class="wrong-list">
      ${result.wrongProblems
        .map((problem) => {
          const practiceType = getPracticeType(problem.typeId);
          const groupMeta = GROUP_META[practiceType.group];

          return `
            <article class="wrong-card">
              <div class="type-card-top ${groupMeta?.className ?? ""}">
                <span class="type-chip">${groupMeta?.chip ?? practiceType.group}</span>
                <span class="rule-chip">${practiceType.label}</span>
              </div>
              <strong>${problem.left} ${problem.operator} ${problem.right} = ${problem.answer}</strong>
              <span>${getHintMessage(problem)}</span>
            </article>
          `;
        })
        .join("")}
    </div>
  `;
}

function renderResult() {
  const sessionType = getSessionMeta(state.lastResult);
  const isMixedLikeSession = isMixedSessionType(state.lastResult.sessionTypeId);
  const cumulativeStat = isMixedLikeSession
    ? null
    : state.snapshot.stats[sessionType.id];
  const cumulativeAccuracy = cumulativeStat ? getAccuracy(cumulativeStat) : null;
  const wrongCountMessage =
    state.lastResult.wrongCount > 0
      ? `틀린 ${state.lastResult.wrongCount}개만 다시 보면 돼요.`
      : "모두 맞았어요. 다시 풀어도 좋아요.";
  const weakTypeStats = getWeakTypeStats(state.lastResult.perTypeStats, 2);
  const primaryWeakType = weakTypeStats[0] ? getPracticeType(weakTypeStats[0].typeId) : null;
  const sortedWrongTypeIds = getSortedTypeEntries(state.lastResult.wrongTypeBreakdown).map(
    ([typeId]) => typeId
  );
  const recommendation = buildResultRecommendation(state.lastResult, state.snapshot);
  const recommendedAction = {
    label: recommendation.ctaLabel,
    action: recommendation.action,
    typeId: recommendation.typeId,
    typeIds: recommendation.typeIds
  };
  const alternateActions = [
    state.lastResult.wrongProblems.length > 0
      ? { label: "틀린 문제 다시", action: "retry-wrong" }
      : null,
    primaryWeakType
      ? {
          label: `${primaryWeakType.label} 새 문제 10개`,
          action: "start-type",
          typeId: primaryWeakType.id
        }
      : null,
    sortedWrongTypeIds.length > 1
      ? {
          label: "틀린 유형만 다시",
          action: "retry-wrong-types",
          typeIds: sortedWrongTypeIds
        }
      : null,
    {
      label: isMixedLikeSession ? "같은 모드 새 문제 10개" : "같은 유형 새 문제 10개",
      action: "retry-same"
    },
    { label: "유형 고르기", action: "open-type-select" },
    { label: "홈", action: "go-home" }
  ].filter(Boolean);
  const secondaryActions = alternateActions.filter(
    (action) => getActionSignature(action) !== getActionSignature(recommendedAction)
  );
  const mixedModeWeakMessage =
    isMixedLikeSession && primaryWeakType
      ? `혼합 모드에서 ${primaryWeakType.label}을 ${
          weakTypeStats[0].totalAnswered - weakTypeStats[0].totalCorrect
        }개 틀렸어요.`
      : primaryWeakType
        ? `${primaryWeakType.label}을 한 번 더 보면 좋아요.`
        : "약한 유형 없이 잘 풀었어요.";

  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="go-home">홈</button>
        <span class="top-bar-title">결과</span>
      </div>

      <div class="result-hero">
        <p class="eyebrow">${sessionType.label}</p>
        <h2>${state.lastResult.correctCount}개 맞았어요</h2>
        <p>${wrongCountMessage}</p>
      </div>

      <article class="info-card result-focus-card result-recommend-card quick-next-card">
        <p class="card-label">바로 이어서</p>
        <strong>${recommendation.title}</strong>
        <p>${recommendation.message}</p>
        <p class="recommend-reason">이유: ${recommendation.reason}</p>
        ${renderActionButton(recommendedAction, "primary-button result-primary-action", {
          autofocus: true
        })}
      </article>

      <div class="result-grid">
        <article class="info-card accent-card">
          <p class="card-label">이번</p>
          <strong>${state.lastResult.accuracy}%</strong>
          <p>${state.lastResult.source === "retry" ? "틀린 문제 다시 푼 결과예요." : "이번 연습 결과예요."}</p>
        </article>

        <article class="info-card">
          <p class="card-label">${isMixedLikeSession ? "섞인 유형" : "지금까지"}</p>
          <strong>${isMixedLikeSession ? `${Object.keys(state.lastResult.typeBreakdown).length}종류` : `${cumulativeAccuracy}%`}</strong>
          <p>${isMixedLikeSession ? formatTypeCountText(state.lastResult.typeBreakdown) : `${cumulativeStat.sessions}번 연습했어요.`}</p>
        </article>
      </div>

      <section class="result-section">
        <h3>이번에 특히 다시 볼 유형</h3>
        <article class="info-card result-focus-card">
          <p class="card-label">이번 세션 약한 유형</p>
          <strong>${primaryWeakType ? primaryWeakType.label : "모두 잘했어요"}</strong>
          <p>${mixedModeWeakMessage}</p>
          ${renderWeakTypeReview(weakTypeStats)}
        </article>
      </section>

      <section class="result-section">
        <h3>이번에 나온 유형</h3>
        ${renderTypePills(state.lastResult.typeBreakdown, "이번 유형 정보가 없어요.")}
      </section>

      <section class="result-section">
        <h3>틀린 유형</h3>
        ${renderTypePills(state.lastResult.wrongTypeBreakdown, "틀린 유형이 없어요.")}
      </section>

      <section class="result-section">
        <h3>틀린 문제</h3>
        ${renderWrongProblems(state.lastResult)}
      </section>

      <div class="bottom-cta stacked-actions">
        ${secondaryActions
          .map((action) =>
            renderActionButton(
              action,
              action.action === "open-type-select" || action.action === "go-home"
                ? "ghost-button wide-button"
                : "secondary-button"
            )
          )
          .join("")}
      </div>
    </section>
  `;
}

function renderApp() {
  switch (state.view) {
    case "history":
      return renderHistory();
    case "type-select":
      return renderTypeSelection();
    case "practice":
      return renderPractice();
    case "result":
      return renderResult();
    case "home":
    default:
      return renderHome();
  }
}

function syncAutoAdvance() {
  clearAutoAdvanceTimer();

  const currentProblem = getCurrentProblem();
  if (
    state.view !== "practice" ||
    !state.session ||
    !currentProblem ||
    !currentProblem.submitted ||
    !currentProblem.isCorrect
  ) {
    return;
  }

  autoAdvanceTimerId = setTimeout(() => {
    autoAdvanceTimerId = null;
    goToNextProblem();
  }, 850);
}

function render() {
  appRoot.innerHTML = renderApp();

  const answerInput = appRoot.querySelector("#answer");
  if (answerInput && !answerInput.disabled) {
    answerInput.focus();
    answerInput.select();
    syncAutoAdvance();
    return;
  }

  const autofocusTarget = appRoot.querySelector("[data-autofocus='true']");
  if (autofocusTarget instanceof HTMLElement) {
    autofocusTarget.focus();
  }

  syncAutoAdvance();
}

appRoot.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const typeId = button.dataset.typeId;
  const typeIds = button.dataset.typeIds?.split(",") ?? [];
  const entryId = button.dataset.entryId;

  switch (action) {
    case "start-recommended":
      startFreshSession(buildHomeRecommendation(state.snapshot).typeId);
      break;
    case "open-type-select":
      clearPendingHistoryAction();
      state.view = "type-select";
      render();
      break;
    case "open-history":
      clearPendingHistoryAction();
      state.view = "history";
      render();
      break;
    case "go-home":
      clearPendingHistoryAction();
      state.view = "home";
      render();
      break;
    case "select-type":
      state.selectedTypeId = typeId;
      render();
      break;
    case "start-selected":
      startFreshSession(state.selectedTypeId);
      break;
    case "retry-wrong":
      startRetrySession();
      break;
    case "start-type":
      startFreshSession(typeId);
      break;
    case "retry-wrong-types":
      startFocusedTypeSession(typeIds);
      break;
    case "retry-same":
      if (state.lastResult?.source === "focus-types" && state.lastResult.focusedTypeIds.length > 1) {
        startFocusedTypeSession(state.lastResult.focusedTypeIds);
        break;
      }
      startFreshSession(state.lastResult?.sessionTypeId ?? state.selectedTypeId);
      break;
    case "set-hint-level":
      state.hintLevel = Number(button.dataset.hintLevel ?? 0);
      render();
      break;
    case "request-clear-recent":
      requestHistoryAction({ kind: "clear-recent" });
      break;
    case "request-clear-all":
      requestHistoryAction({ kind: "clear-all" });
      break;
    case "request-delete-session":
      requestHistoryAction({ kind: "delete-session", entryId });
      break;
    case "cancel-history-action":
      clearPendingHistoryAction();
      render();
      break;
    case "confirm-history-action":
      applyHistoryAction();
      break;
    default:
      break;
  }
});

appRoot.addEventListener("input", (event) => {
  const answerInput = event.target.closest("#answer");
  if (!answerInput || !state.session) {
    return;
  }

  const currentProblem = getCurrentProblem();
  currentProblem.inputValue = answerInput.value.replace(/[^\d-]/g, "");
  answerInput.value = currentProblem.inputValue;
  state.session.validationMessage = "";
});

appRoot.addEventListener("submit", (event) => {
  const form = event.target.closest('[data-role="answer-form"]');
  if (!form) {
    return;
  }

  event.preventDefault();
  const currentProblem = getCurrentProblem();
  if (currentProblem?.submitted) {
    goToNextProblem();
    return;
  }
  handleAnswerSubmit();
});

render();
