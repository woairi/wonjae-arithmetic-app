import {
  PRACTICE_TYPES,
  getPracticeType,
  getSessionType,
  isMixedSessionType
} from "./constants.js";
import { getRecommendedTypeId } from "./storage.js";

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
const TYPE_RETRY_MESSAGES = {
  "addition-basic": "이번엔 올림 없는 덧셈으로 자신감을 다시 올려봐요.",
  "addition-carry-2": "받아올림 2번을 한 번 더 해보면 좋아요.",
  "addition-carry-3": "받아올림 3번을 한 번 더 해보면 좋아요.",
  "subtraction-borrow-1": "받아내림 1번을 한 번 더 해보면 좋아요.",
  "subtraction-borrow-2": "받아내림 2번을 한 번 더 해보면 좋아요."
};

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

export function buildResultRecommendation(result, snapshot) {
  const sessionType = getSessionType(result.sessionTypeId);
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
        ctaLabel: "틀린 유형만 다시",
        action: "retry-wrong-types",
        typeIds: wrongTypeIds
      };
    }

    if (primaryWeakType) {
      return {
        title: primaryWeakType.label,
        message: TYPE_RETRY_MESSAGES[primaryWeakType.id],
        ctaLabel: `${primaryWeakType.label} 새 문제 10개`,
        action: "start-type",
        typeId: primaryWeakType.id
      };
    }

    return {
      title: sessionType.label,
      message: "같은 흐름으로 한 번 더 풀어보면 좋아요.",
      ctaLabel: sameModeLabel,
      action: "retry-same"
    };
  }

  const nextChallengeTypeId = NEXT_CHALLENGE_TYPE[result.sessionTypeId];
  if (nextChallengeTypeId) {
    const nextType = getPracticeType(nextChallengeTypeId);

    return {
      title: nextType.label,
      message: `이번엔 ${nextType.label}으로 한 단계 올려봐요.`,
      ctaLabel: `${nextType.label} 새 문제 10개`,
      action: "start-type",
      typeId: nextType.id
    };
  }

  const recommendedTypeId = getRecommendedTypeId(snapshot);
  if (
    recommendedTypeId &&
    !isMixedSessionType(recommendedTypeId) &&
    recommendedTypeId !== result.sessionTypeId
  ) {
    const recommendedType = getPracticeType(recommendedTypeId);

    return {
      title: recommendedType.label,
      message: isMixedSessionType(result.sessionTypeId)
        ? `이번엔 ${recommendedType.label}만 골라 또렷하게 풀어봐요.`
        : `이번엔 ${recommendedType.label}으로 감각을 이어가요.`,
      ctaLabel: `${recommendedType.label} 새 문제 10개`,
      action: "start-type",
      typeId: recommendedType.id
    };
  }

  return {
    title: sessionType.label,
    message: isMixedSessionType(result.sessionTypeId)
      ? "이번엔 전체 유형 랜덤을 한 번 더 풀어봐요."
      : "같은 유형 새 문제로 감각을 이어가요.",
    ctaLabel: sameModeLabel,
    action: "retry-same"
  };
}
