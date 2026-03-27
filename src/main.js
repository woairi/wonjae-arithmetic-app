import {
  DEFAULT_TYPE_ID,
  PLACE_LABELS,
  PRACTICE_TYPES,
  SESSION_SIZE,
  getPracticeType
} from "./constants.js";
import {
  createFreshSession,
  createRetrySession,
  getHintMessage
} from "./problem-engine.js";
import {
  getAccuracy,
  getRecommendedTypeId,
  getRecentSummary,
  getWeakestTypeId,
  loadSnapshot,
  recordSession,
  saveSnapshot
} from "./storage.js";

const appRoot = document.querySelector("#app");
const groupedTypes = PRACTICE_TYPES.reduce((groups, type) => {
  groups[type.group] ??= [];
  groups[type.group].push(type);
  return groups;
}, {});
const GROUP_META = {
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
  snapshot: loadSnapshot(),
  session: null,
  lastResult: null
};

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

function getCurrentProblem() {
  return state.session?.problems[state.session.currentIndex] ?? null;
}

function createSessionResult(session) {
  const correctCount = session.problems.filter((problem) => problem.isCorrect).length;
  const wrongProblems = session.problems.filter((problem) => !problem.isCorrect);
  const totalCount = session.problems.length;
  const accuracy = Math.round((correctCount / totalCount) * 100);

  return {
    id: crypto.randomUUID(),
    typeId: session.typeId,
    source: session.source,
    correctCount,
    wrongCount: wrongProblems.length,
    totalCount,
    accuracy,
    wrongProblems,
    finishedAt: new Date().toISOString()
  };
}

function startFreshSession(typeId) {
  state.selectedTypeId = typeId;
  state.session = createFreshSession(typeId, SESSION_SIZE);
  state.lastResult = null;
  state.view = "practice";
  render();
}

function startRetrySession() {
  if (!state.lastResult || state.lastResult.wrongProblems.length === 0) {
    return;
  }

  state.session = createRetrySession(state.lastResult.typeId, state.lastResult.wrongProblems);
  state.view = "practice";
  render();
}

function finishSession() {
  const sessionResult = createSessionResult(state.session);
  state.snapshot = recordSession(state.snapshot, sessionResult);
  saveSnapshot(state.snapshot);

  state.lastResult = {
    ...sessionResult,
    cumulativeStat: state.snapshot.stats[sessionResult.typeId]
  };
  state.session = null;
  state.view = "result";
  render();
}

function goToNextProblem() {
  if (!state.session) {
    return;
  }

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
    ? "맞았어요. 다음!"
    : `정답 ${currentProblem.answer}. ${getHintMessage(currentProblem)}`;
  state.session.validationMessage = "";
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
  const leftDigits = String(problem.left).padStart(digitCount, " ").split("");
  const rightDigits = String(problem.right).padStart(digitCount, " ").split("");

  return `
    <div class="problem-board" style="--digit-columns: ${digitCount}">
      <div class="place-row">
        <span class="operator-space"></span>
        ${placeLabels.map((label) => `<span class="place-label">${label}</span>`).join("")}
      </div>
      <div class="digit-row">
        <span class="operator-space"></span>
        ${leftDigits.map(renderDigitCell).join("")}
      </div>
      <div class="digit-row">
        <span class="operator-mark">${problem.operator}</span>
        ${rightDigits.map(renderDigitCell).join("")}
      </div>
      <div class="digit-line"></div>
    </div>
  `;
}

function renderHome() {
  const recommendedType = getPracticeType(getRecommendedTypeId(state.snapshot));
  const weakestTypeId = getWeakestTypeId(state.snapshot);
  const weakestType = weakestTypeId ? getPracticeType(weakestTypeId) : null;
  const recentSummary = getRecentSummary(state.snapshot);
  const recentType = recentSummary ? getPracticeType(recentSummary.typeId) : null;

  return `
    <section class="screen hero-screen">
      <div class="hero-card">
        <p class="eyebrow">원재 연산앱</p>
        <h1>오늘도<br />차근차근 풀어요.</h1>
        <p class="hero-copy">큰 숫자로 보고, 10문제만 풀어요.</p>
        <button class="primary-button" data-action="start-recommended">
          바로 시작
        </button>
      </div>

      <div class="card-grid">
        <article class="info-card accent-card">
          <p class="card-label">오늘 추천</p>
          <strong>${recommendedType.label}</strong>
          <p>${recommendedType.description}</p>
        </article>

        <article class="info-card">
          <p class="card-label">조금 더 하기</p>
          <strong>${weakestType ? weakestType.label : "아직 기록 없음"}</strong>
          <p>${weakestType ? "여길 한 번 더 해요." : "처음이면 3자리 덧셈부터 해요."}</p>
        </article>

        <article class="info-card">
          <p class="card-label">마지막 연습</p>
          <strong>${recentSummary ? `${recentSummary.correctCount} / ${recentSummary.totalCount}` : "아직 없음"}</strong>
          <p>${recentSummary ? `${recentType.label} · ${recentSummary.accuracy}% · ${formatDate(recentSummary.finishedAt)}` : "첫 연습을 시작해요."}</p>
        </article>
      </div>

      <div class="home-actions">
        <button class="secondary-button" data-action="open-type-select">유형 고르기</button>
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
        <p>한 번에 한 가지씩 연습해요.</p>
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
        <button class="primary-button" data-action="start-selected">
          이걸로 10문제 풀기
        </button>
      </div>
    </section>
  `;
}

function renderPractice() {
  const currentProblem = getCurrentProblem();
  const practiceType = getPracticeType(state.session.typeId);
  const groupMeta = GROUP_META[practiceType.group];

  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="open-type-select">유형 바꾸기</button>
        <span class="top-bar-title">문제 풀기</span>
      </div>

      <div class="progress-card">
        <article class="practice-focus ${groupMeta?.className ?? ""}">
          <div class="type-card-top">
            <span class="type-chip">${groupMeta?.chip ?? practiceType.group}</span>
            <span class="rule-chip">${practiceType.cardRule}</span>
          </div>
          <strong>${practiceType.label}</strong>
          <p>${practiceType.description}</p>
        </article>
        <article class="count-card">
          <p class="card-label">문제</p>
          <strong>${state.session.currentIndex + 1} / ${state.session.problems.length}</strong>
          <p>지금 ${state.session.currentIndex + 1}번째 문제예요.</p>
        </article>
      </div>

      <div class="problem-card">
        <div class="problem-meta">
          <p class="card-label">식</p>
          <strong>${currentProblem.left} ${currentProblem.operator} ${currentProblem.right}</strong>
          <p>${practiceType.summary}</p>
        </div>

        ${renderProblemBoard(currentProblem)}

        <form class="answer-form" data-role="answer-form">
          <label for="answer" class="answer-label">답</label>
          <input
            id="answer"
            class="answer-input"
            inputmode="numeric"
            autocomplete="off"
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
              : `<p class="helper-copy">${practiceType.hint}</p>`
          }
          <button class="primary-button" type="submit">
            ${currentProblem.submitted
              ? state.session.currentIndex === state.session.problems.length - 1
                ? "결과 보기"
                : "다음"
              : "확인"}
          </button>
        </form>
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
        .map(
          (problem) => `
            <article class="wrong-card">
              <strong>${problem.left} ${problem.operator} ${problem.right} = ${problem.answer}</strong>
              <span>${getHintMessage(problem)}</span>
            </article>
          `
        )
        .join("")}
    </div>
  `;
}

function renderResult() {
  const practiceType = getPracticeType(state.lastResult.typeId);
  const cumulativeAccuracy = getAccuracy(state.lastResult.cumulativeStat);
  const wrongCountMessage =
    state.lastResult.wrongCount > 0
      ? `틀린 ${state.lastResult.wrongCount}개만 다시 보면 돼요.`
      : "모두 맞았어요. 다시 풀어도 좋아요.";

  return `
    <section class="screen">
      <div class="top-bar">
        <button class="ghost-button" data-action="go-home">홈</button>
        <span class="top-bar-title">결과</span>
      </div>

      <div class="result-hero">
        <p class="eyebrow">${practiceType.label}</p>
        <h2>${state.lastResult.correctCount}개 맞았어요</h2>
        <p>${wrongCountMessage}</p>
      </div>

      <div class="result-grid">
        <article class="info-card accent-card">
          <p class="card-label">이번</p>
          <strong>${state.lastResult.accuracy}%</strong>
          <p>${state.lastResult.source === "retry" ? "틀린 문제 다시 푼 결과예요." : "이번 연습 결과예요."}</p>
        </article>

        <article class="info-card">
          <p class="card-label">지금까지</p>
          <strong>${cumulativeAccuracy}%</strong>
          <p>${state.lastResult.cumulativeStat.sessions}번 연습했어요.</p>
        </article>
      </div>

      <section class="result-section">
        <h3>틀린 문제</h3>
        ${renderWrongProblems(state.lastResult)}
      </section>

      <div class="bottom-cta stacked-actions">
        ${
          state.lastResult.wrongProblems.length > 0
            ? `<button class="primary-button" data-action="retry-wrong">틀린 문제 다시</button>`
            : ""
        }
        <button class="secondary-button" data-action="retry-same">같은 유형 다시</button>
        <button class="ghost-button wide-button" data-action="open-type-select">유형 고르기</button>
        <button class="ghost-button wide-button" data-action="go-home">홈</button>
      </div>
    </section>
  `;
}

function renderApp() {
  switch (state.view) {
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

function render() {
  appRoot.innerHTML = renderApp();

  const answerInput = appRoot.querySelector("#answer");
  if (answerInput && !answerInput.disabled) {
    answerInput.focus();
  }
}

appRoot.addEventListener("click", (event) => {
  const button = event.target.closest("[data-action]");
  if (!button) {
    return;
  }

  const action = button.dataset.action;
  const typeId = button.dataset.typeId;

  switch (action) {
    case "start-recommended":
      startFreshSession(getRecommendedTypeId(state.snapshot));
      break;
    case "open-type-select":
      state.view = "type-select";
      render();
      break;
    case "go-home":
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
    case "retry-same":
      startFreshSession(state.lastResult?.typeId ?? state.selectedTypeId);
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
