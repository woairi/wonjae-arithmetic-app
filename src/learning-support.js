import {
  DEFAULT_TYPE_ID,
  MIXED_ALL_TYPE_ID,
  PRACTICE_TYPES,
  getPracticeType,
  getSessionType,
  isMixedSessionType
} from "./constants.js";
import {
  getLastSevenDaySummary,
  getRecentSingleTypeSessions,
  getWeakestTypeId
} from "./storage.js";

export const HINT_LEVELS = [
  {
    value: 0,
    label: "숨김",
    toolbarCopy: "먼저 혼자 풀어요."
  },
  {
    value: 1,
    label: "먼저",
    toolbarCopy: "먼저 볼 자리 하나를 보여줘요."
  },
  {
    value: 2,
    label: "직접",
    toolbarCopy: "올림·내림 자리를 더 직접 보여줘요."
  }
];

const PRACTICE_TYPE_ORDER = PRACTICE_TYPES.map((type) => type.id);
const ALL_PROBLEM_POSITIONS = ["일의 자리", "십의 자리", "백의 자리"];
const POSITION_SHORT_LABELS = {
  "일의 자리": "일",
  "십의 자리": "십",
  "백의 자리": "백"
};
const NEXT_CHALLENGE_TYPE = {
  "addition-basic": "addition-carry-2",
  "addition-carry-2": "addition-carry-3",
  "subtraction-borrow-1": "subtraction-borrow-2"
};
const PREVIOUS_CHALLENGE_TYPE = {
  "addition-carry-2": "addition-basic",
  "addition-carry-3": "addition-carry-2",
  "subtraction-borrow-2": "subtraction-borrow-1"
};
const TYPE_RETRY_MESSAGES = {
  "addition-basic": "이번엔 올림 없는 덧셈으로 자신감을 다시 올려봐요.",
  "addition-carry-2": "받아올림 2번을 한 번 더 해보면 좋아요.",
  "addition-carry-3": "받아올림 3번을 한 번 더 해보면 좋아요.",
  "subtraction-borrow-1": "받아내림 1번을 한 번 더 해보면 좋아요.",
  "subtraction-borrow-2": "받아내림 2번을 한 번 더 해보면 좋아요."
};
const SUCCESS_ACCURACY = 90;
const STRUGGLE_ACCURACY = 60;
const STRONG_WEEKLY_WRONG_COUNT = 4;
const STRONG_WEEKLY_ACCURACY = 60;

function buildStartTypeRecommendation(typeId, message, reason) {
  const practiceType = getPracticeType(typeId);

  return {
    title: practiceType.label,
    message,
    reason,
    ctaLabel: `${practiceType.label} 새 문제 10개`,
    action: "start-type",
    typeId: practiceType.id
  };
}

function buildMixedRecommendation(message, reason) {
  return {
    title: "전체 유형 랜덤",
    message,
    reason,
    ctaLabel: "전체 유형 랜덤 10문제",
    action: "start-type",
    typeId: MIXED_ALL_TYPE_ID
  };
}

function getRecentTypeStat(summary, typeId) {
  return summary.typeStats.find((typeStat) => typeStat.typeId === typeId) ?? null;
}

function getRecentSuccessStreak(snapshot, typeId, now = new Date()) {
  const recentSessions = getRecentSingleTypeSessions(snapshot, typeId, {
    limit: 3,
    days: 7,
    now
  });
  let streak = 0;

  recentSessions.forEach((session) => {
    if (session.accuracy >= SUCCESS_ACCURACY) {
      streak += 1;
    }
  });

  return streak;
}

function getRecentStruggleStreak(snapshot, typeId, now = new Date()) {
  const recentSessions = getRecentSingleTypeSessions(snapshot, typeId, {
    limit: 3,
    days: 7,
    now
  });
  let streak = 0;

  recentSessions.forEach((session) => {
    if (session.accuracy <= STRUGGLE_ACCURACY) {
      streak += 1;
    }
  });

  return streak;
}

function getStepUpRecommendation(snapshot, typeId, now = new Date()) {
  const nextTypeId = NEXT_CHALLENGE_TYPE[typeId];
  if (!nextTypeId) {
    return null;
  }

  const successStreak = getRecentSuccessStreak(snapshot, typeId, now);
  if (successStreak < 2) {
    return null;
  }

  return buildStartTypeRecommendation(
    nextTypeId,
    `이번엔 ${getPracticeType(nextTypeId).label}으로 한 단계 올려봐요.`,
    `최근 ${successStreak}번 연속 90% 이상 맞았어요.`
  );
}

function getWeakPracticeRecommendation(snapshot, weeklySummary, options = {}) {
  const { strongOnly = false, now = new Date() } = options;
  const weeklyWeakTypeId = weeklySummary.mostWrongTypeId;
  const weeklyWeakTypeStat = weeklyWeakTypeId
    ? getRecentTypeStat(weeklySummary, weeklyWeakTypeId)
    : null;

  if (weeklyWeakTypeId && getRecentStruggleStreak(snapshot, weeklyWeakTypeId, now) >= 2) {
    const easierTypeId = PREVIOUS_CHALLENGE_TYPE[weeklyWeakTypeId];
    if (easierTypeId) {
      return buildStartTypeRecommendation(
        easierTypeId,
        `지금은 ${getPracticeType(easierTypeId).label}으로 감각을 다시 잡아요.`,
        "같은 어려운 유형이 최근에 두 번 이상 어려웠어요."
      );
    }
  }

  if (
    weeklyWeakTypeId &&
    (!strongOnly ||
      weeklyWeakTypeStat.totalWrong >= STRONG_WEEKLY_WRONG_COUNT ||
      getTypeAccuracyFromCounts(weeklyWeakTypeStat) <= STRONG_WEEKLY_ACCURACY)
  ) {
    return buildStartTypeRecommendation(
      weeklyWeakTypeId,
      `이번엔 ${getPracticeType(weeklyWeakTypeId).label}만 다시 또렷하게 풀어봐요.`,
      "최근 7일에 가장 많이 틀렸어요."
    );
  }

  if (strongOnly) {
    return null;
  }

  const fallbackTypeId = getWeakestTypeId(snapshot);
  if (!fallbackTypeId) {
    return null;
  }

  return buildStartTypeRecommendation(
    fallbackTypeId,
    `이번엔 ${getPracticeType(fallbackTypeId).label}으로 감각을 다시 잡아요.`,
    weeklySummary.practiceCount > 0 ? "누적 기록에서 가장 약한 유형이에요." : "처음이라 가장 쉬운 유형부터 시작해요."
  );
}

function shouldRecommendMixed(weeklySummary) {
  return (
    weeklySummary.practiceCount >= 3 &&
    weeklySummary.distinctTypeCount >= 2 &&
    (weeklySummary.averageAccuracy ?? 0) >= 85 &&
    !weeklySummary.mostWrongTypeId
  );
}

function getRecentSingleTypeIds(snapshot) {
  const recentTypeIds = [];

  (snapshot?.history ?? []).forEach((entry) => {
    if (isMixedSessionType(entry.sessionTypeId) || recentTypeIds.includes(entry.sessionTypeId)) {
      return;
    }

    recentTypeIds.push(entry.sessionTypeId);
  });

  return recentTypeIds;
}

export function buildHomeRecommendation(snapshot, options = {}) {
  const { now = new Date() } = options;
  const weeklySummary = getLastSevenDaySummary(snapshot, { now });

  if (weeklySummary.practiceCount === 0) {
    return buildStartTypeRecommendation(
      DEFAULT_TYPE_ID,
      "처음은 3자리 덧셈부터 차근차근 해요.",
      "기록이 아직 없어서 가장 쉬운 흐름부터 시작해요."
    );
  }

  const strongWeakRecommendation = getWeakPracticeRecommendation(snapshot, weeklySummary, {
    strongOnly: true,
    now
  });
  if (strongWeakRecommendation) {
    return strongWeakRecommendation;
  }

  const stepUpRecommendation = getRecentSingleTypeIds(snapshot)
    .map((typeId) => getStepUpRecommendation(snapshot, typeId, now))
    .find(Boolean);
  if (stepUpRecommendation) {
    return stepUpRecommendation;
  }

  if (shouldRecommendMixed(weeklySummary)) {
    return buildMixedRecommendation(
      "이번엔 섞어서 균형을 확인해요.",
      "최근 여러 유형을 고르게 잘 풀었어요."
    );
  }

  const weakRecommendation = getWeakPracticeRecommendation(snapshot, weeklySummary, { now });
  if (weakRecommendation) {
    return weakRecommendation;
  }

  const recentTypeId = weeklySummary.mostPracticedTypeId ?? DEFAULT_TYPE_ID;
  return buildStartTypeRecommendation(
    recentTypeId,
    `이번엔 ${getPracticeType(recentTypeId).label}으로 흐름을 이어가요.`,
    "최근에 자주 푼 유형이라 바로 다시 시작하기 좋아요."
  );
}

function sortTypeIdsByOrder(typeCounts) {
  return PRACTICE_TYPE_ORDER.filter((typeId) => typeCounts?.[typeId]);
}

function formatShortPositions(positions) {
  return positions.map((position) => POSITION_SHORT_LABELS[position] ?? position.replace("의 자리", ""));
}

function getHintActionWord(problem) {
  return problem.operator === "+" ? "올림" : "내림";
}

export function getProblemFocusPositions(problem) {
  if (!problem?.analysis) {
    return [];
  }

  return problem.operator === "+"
    ? problem.analysis.carryPositions
    : problem.analysis.borrowPositions;
}

export function getHintFocusPositions(problem, hintLevel) {
  if (!problem || hintLevel <= 0) {
    return [];
  }

  const focusPositions = getProblemFocusPositions(problem);
  if (hintLevel === 1) {
    return [focusPositions[0] ?? "일의 자리"];
  }

  return focusPositions.length > 0 ? focusPositions : ALL_PROBLEM_POSITIONS;
}

export function getHintToolbarCopy(hintLevel) {
  return HINT_LEVELS.find((level) => level.value === hintLevel)?.toolbarCopy ?? HINT_LEVELS[0].toolbarCopy;
}

export function getBoardFocusText(problem, hintLevel, variant = "look") {
  if (!problem || hintLevel <= 0) {
    return "";
  }

  const practiceType = getPracticeType(problem.typeId);
  const focusPositions = getProblemFocusPositions(problem);

  if (hintLevel === 1) {
    const firstPosition = getHintFocusPositions(problem, hintLevel)[0];
    const shortPosition = POSITION_SHORT_LABELS[firstPosition] ?? "일";

    return variant === "wrong"
      ? `${shortPosition} 자리부터 다시 봐요.`
      : `먼저 ${shortPosition} 자리부터 봐요.`;
  }

  if (focusPositions.length === 0) {
    return variant === "wrong" ? "자리만 차례대로 다시 봐요." : practiceType.hint;
  }

  const actionWord = getHintActionWord(problem);
  const shortPositions = formatShortPositions(focusPositions).join(", ");

  return variant === "wrong"
    ? `${shortPositions} 자리 ${actionWord}을 다시 봐요.`
    : `${shortPositions} 자리 ${actionWord}을 봐요.`;
}

export function getHintHelperMessage(problem, hintLevel) {
  if (hintLevel <= 0) {
    return "힌트를 숨겼어요. 먼저 혼자 풀어봐요.";
  }

  return getBoardFocusText(problem, hintLevel, "look");
}

export function getTypeAccuracyFromCounts(typeStat) {
  if (!typeStat || typeStat.totalAnswered === 0) {
    return 0;
  }

  return Math.round((typeStat.totalCorrect / typeStat.totalAnswered) * 100);
}

export function getWeakTypeStats(typeStats, limit = 2) {
  return [...typeStats]
    .filter((typeStat) => typeStat.totalAnswered > 0 && typeStat.totalCorrect < typeStat.totalAnswered)
    .sort((left, right) => {
      const accuracyGap = getTypeAccuracyFromCounts(left) - getTypeAccuracyFromCounts(right);
      if (accuracyGap !== 0) {
        return accuracyGap;
      }

      const wrongGap =
        right.totalAnswered - right.totalCorrect - (left.totalAnswered - left.totalCorrect);
      if (wrongGap !== 0) {
        return wrongGap;
      }

      return PRACTICE_TYPE_ORDER.indexOf(left.typeId) - PRACTICE_TYPE_ORDER.indexOf(right.typeId);
    })
    .slice(0, limit);
}

export function buildResultRecommendation(result, snapshot, options = {}) {
  const { now = new Date() } = options;
  const sessionType = getSessionType(result.sessionTypeId);
  const weeklySummary = getLastSevenDaySummary(snapshot, { now });
  const weakTypeStats = getWeakTypeStats(result.perTypeStats ?? [], 2);
  const primaryWeakType = weakTypeStats[0] ? getPracticeType(weakTypeStats[0].typeId) : null;
  const wrongTypeIds = sortTypeIdsByOrder(result.wrongTypeBreakdown);
  const sameModeLabel = isMixedSessionType(result.sessionTypeId)
    ? "같은 모드 새 문제 10개"
    : "같은 유형 새 문제 10개";

  if (result.wrongCount > 0) {
    if (isMixedSessionType(result.sessionTypeId) && wrongTypeIds.length > 1 && primaryWeakType) {
      return {
        title: "틀린 유형만 다시",
        message: `${primaryWeakType.label}부터 틀린 유형만 다시 풀어봐요.`,
        reason: "여러 유형이 함께 흔들렸어요.",
        ctaLabel: "틀린 유형만 다시",
        action: "retry-wrong-types",
        typeIds: wrongTypeIds
      };
    }

    if (
      !isMixedSessionType(result.sessionTypeId) &&
      result.accuracy <= STRUGGLE_ACCURACY &&
      getRecentStruggleStreak(snapshot, result.sessionTypeId, now) >= 2
    ) {
      const easierTypeId = PREVIOUS_CHALLENGE_TYPE[result.sessionTypeId];
      if (easierTypeId) {
        return buildStartTypeRecommendation(
          easierTypeId,
          `지금은 ${getPracticeType(easierTypeId).label}으로 감각을 다시 잡아요.`,
          "같은 어려운 유형이 최근에 두 번 이상 어려웠어요."
        );
      }
    }

    if (primaryWeakType) {
      return buildStartTypeRecommendation(
        primaryWeakType.id,
        TYPE_RETRY_MESSAGES[primaryWeakType.id],
        weeklySummary.mostWrongTypeId === primaryWeakType.id
          ? "최근 7일에도 가장 많이 틀린 유형이에요."
          : "방금 약했던 유형을 바로 다시 보면 좋아요."
      );
    }

    return {
      title: sessionType.label,
      message: "같은 흐름으로 한 번 더 풀어보면 좋아요.",
      reason: "방금 푼 감각이 남아 있을 때 다시 보면 좋아요.",
      ctaLabel: sameModeLabel,
      action: "retry-same"
    };
  }

  if (!isMixedSessionType(result.sessionTypeId)) {
    const stepUpRecommendation = getStepUpRecommendation(snapshot, result.sessionTypeId, now);
    if (stepUpRecommendation) {
      return stepUpRecommendation;
    }
  }

  if (isMixedSessionType(result.sessionTypeId) && weeklySummary.mostWrongTypeId) {
    return buildStartTypeRecommendation(
      weeklySummary.mostWrongTypeId,
      `섞어 보니 ${getPracticeType(weeklySummary.mostWrongTypeId).label}만 따로 보면 좋아요.`,
      "혼합 모드 뒤에는 약한 유형 하나를 또렷하게 보면 좋아요."
    );
  }

  if (!isMixedSessionType(result.sessionTypeId) && shouldRecommendMixed(weeklySummary)) {
    return buildMixedRecommendation(
      "이번엔 섞어서 균형을 확인해요.",
      "한 가지 유형이 안정적이라 섞어 풀 차례예요."
    );
  }

  const homeRecommendation = buildHomeRecommendation(snapshot, { now });
  if (
    homeRecommendation.action === "start-type" &&
    homeRecommendation.typeId !== result.sessionTypeId
  ) {
    return {
      ...homeRecommendation,
      message: isMixedSessionType(result.sessionTypeId)
        ? `이번엔 ${homeRecommendation.title}만 골라 또렷하게 풀어봐요.`
        : homeRecommendation.message
    };
  }

  return {
    title: sessionType.label,
    message: isMixedSessionType(result.sessionTypeId)
      ? "이번엔 전체 유형 랜덤을 한 번 더 풀어봐요."
      : "같은 유형 새 문제로 감각을 이어가요.",
    reason: isMixedSessionType(result.sessionTypeId)
      ? "여러 유형 감각을 이어가기에 좋아요."
      : "방금 잘 풀었던 흐름을 이어가기 좋아요.",
    ctaLabel: sameModeLabel,
    action: "retry-same"
  };
}
