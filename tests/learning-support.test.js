import test from "node:test";
import assert from "node:assert/strict";

import {
  buildHomeRecommendation,
  buildResultRecommendation,
  getBoardFocusText,
  getHintFocusPositions
} from "../src/learning-support.js";
import { MIXED_ALL_TYPE_ID } from "../src/constants.js";
import { createEmptySnapshot } from "../src/storage.js";

const FIXED_NOW = new Date("2026-03-28T12:00:00.000Z");

test("hint levels reveal focus in small steps", () => {
  const problem = {
    typeId: "addition-carry-2",
    operator: "+",
    analysis: {
      carryPositions: ["일의 자리", "십의 자리"],
      borrowPositions: []
    }
  };

  assert.deepEqual(getHintFocusPositions(problem, 0), []);
  assert.deepEqual(getHintFocusPositions(problem, 1), ["일의 자리"]);
  assert.deepEqual(getHintFocusPositions(problem, 2), ["일의 자리", "십의 자리"]);
  assert.equal(getBoardFocusText(problem, 1), "먼저 일 자리부터 봐요.");
  assert.equal(getBoardFocusText(problem, 2), "일, 십 자리 올림을 봐요.");
});

test("hint levels still guide basic addition without carry positions", () => {
  const problem = {
    typeId: "addition-basic",
    operator: "+",
    analysis: {
      carryPositions: [],
      borrowPositions: []
    }
  };

  assert.deepEqual(getHintFocusPositions(problem, 1), ["일의 자리"]);
  assert.deepEqual(getHintFocusPositions(problem, 2), ["일의 자리", "십의 자리", "백의 자리"]);
  assert.equal(getBoardFocusText(problem, 2), "올림 없이 자리 맞춰 더해요.");
});

test("result recommendation points to weakest type retry in single mode", () => {
  const recommendation = buildResultRecommendation(
    {
      sessionTypeId: "subtraction-borrow-2",
      accuracy: 80,
      wrongCount: 2,
      wrongTypeBreakdown: {
        "subtraction-borrow-2": 2
      },
      perTypeStats: [
        { typeId: "subtraction-borrow-2", totalAnswered: 10, totalCorrect: 8 }
      ]
    },
    createEmptySnapshot(),
    { now: FIXED_NOW }
  );

  assert.deepEqual(recommendation, {
    title: "받아내림 2번",
    message: "받아내림 2번을 한 번 더 해보면 좋아요.",
    reason: "방금 약했던 유형을 바로 다시 보면 좋아요.",
    ctaLabel: "받아내림 2번 새 문제 10개",
    action: "start-type",
    typeId: "subtraction-borrow-2"
  });
});

test("result recommendation uses wrong-type retry for mixed sessions", () => {
  const recommendation = buildResultRecommendation(
    {
      sessionTypeId: MIXED_ALL_TYPE_ID,
      accuracy: 70,
      wrongCount: 3,
      wrongTypeBreakdown: {
        "addition-carry-2": 1,
        "subtraction-borrow-2": 2
      },
      perTypeStats: [
        { typeId: "addition-carry-2", totalAnswered: 4, totalCorrect: 3 },
        { typeId: "subtraction-borrow-2", totalAnswered: 3, totalCorrect: 1 }
      ]
    },
    createEmptySnapshot(),
    { now: FIXED_NOW }
  );

  assert.deepEqual(recommendation, {
    title: "틀린 유형만 다시",
    message: "받아내림 2번부터 틀린 유형만 다시 풀어봐요.",
    reason: "여러 유형이 함께 흔들렸어요.",
    ctaLabel: "틀린 유형만 다시",
    action: "retry-wrong-types",
    typeIds: ["addition-carry-2", "subtraction-borrow-2"]
  });
});

test("result recommendation can step up after a perfect session", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "session-2",
      sessionTypeId: "addition-basic",
      accuracy: 100,
      correctCount: 10,
      totalCount: 10,
      finishedAt: "2026-03-28T10:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {}
    },
    {
      id: "session-1",
      sessionTypeId: "addition-basic",
      accuracy: 90,
      correctCount: 9,
      totalCount: 10,
      finishedAt: "2026-03-27T10:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {
        "addition-basic": 1
      }
    }
  ];

  const recommendation = buildResultRecommendation(
    {
      sessionTypeId: "addition-basic",
      accuracy: 100,
      wrongCount: 0,
      wrongTypeBreakdown: {},
      perTypeStats: [
        { typeId: "addition-basic", totalAnswered: 10, totalCorrect: 10 }
      ]
    },
    snapshot,
    { now: FIXED_NOW }
  );

  assert.deepEqual(recommendation, {
    title: "받아올림 2번",
    message: "이번엔 받아올림 2번으로 한 단계 올려봐요.",
    reason: "최근 2번 연속 90% 이상 맞았어요.",
    ctaLabel: "받아올림 2번 새 문제 10개",
    action: "start-type",
    typeId: "addition-carry-2"
  });
});

test("home recommendation steps down when a hard type stays difficult", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "session-2",
      sessionTypeId: "addition-carry-3",
      accuracy: 40,
      correctCount: 4,
      totalCount: 10,
      finishedAt: "2026-03-28T10:00:00.000Z",
      typeBreakdown: {
        "addition-carry-3": 10
      },
      wrongTypeBreakdown: {
        "addition-carry-3": 6
      }
    },
    {
      id: "session-1",
      sessionTypeId: "addition-carry-3",
      accuracy: 50,
      correctCount: 5,
      totalCount: 10,
      finishedAt: "2026-03-27T10:00:00.000Z",
      typeBreakdown: {
        "addition-carry-3": 10
      },
      wrongTypeBreakdown: {
        "addition-carry-3": 5
      }
    }
  ];

  const recommendation = buildHomeRecommendation(snapshot, { now: FIXED_NOW });

  assert.deepEqual(recommendation, {
    title: "받아올림 2번",
    message: "지금은 받아올림 2번으로 감각을 다시 잡아요.",
    reason: "같은 어려운 유형이 최근에 두 번 이상 어려웠어요.",
    ctaLabel: "받아올림 2번 새 문제 10개",
    action: "start-type",
    typeId: "addition-carry-2"
  });
});

test("home recommendation can switch to mixed practice after a balanced week", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "session-3",
      sessionTypeId: "subtraction-borrow-1",
      accuracy: 90,
      correctCount: 9,
      totalCount: 10,
      finishedAt: "2026-03-28T10:00:00.000Z",
      typeBreakdown: {
        "subtraction-borrow-1": 10
      },
      wrongTypeBreakdown: {}
    },
    {
      id: "session-2",
      sessionTypeId: "addition-carry-2",
      accuracy: 90,
      correctCount: 9,
      totalCount: 10,
      finishedAt: "2026-03-27T10:00:00.000Z",
      typeBreakdown: {
        "addition-carry-2": 10
      },
      wrongTypeBreakdown: {}
    },
    {
      id: "session-1",
      sessionTypeId: "addition-basic",
      accuracy: 100,
      correctCount: 10,
      totalCount: 10,
      finishedAt: "2026-03-26T10:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {}
    }
  ];

  const recommendation = buildHomeRecommendation(snapshot, { now: FIXED_NOW });

  assert.deepEqual(recommendation, {
    title: "전체 유형 랜덤",
    message: "이번엔 섞어서 균형을 확인해요.",
    reason: "최근 여러 유형을 고르게 잘 풀었어요.",
    ctaLabel: "전체 유형 랜덤 10문제",
    action: "start-type",
    typeId: "mixed-all"
  });
});
