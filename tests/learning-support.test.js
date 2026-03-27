import test from "node:test";
import assert from "node:assert/strict";

import {
  buildResultRecommendation,
  getBoardFocusText,
  getHintFocusPositions
} from "../src/learning-support.js";
import { MIXED_ALL_TYPE_ID } from "../src/constants.js";
import { createEmptySnapshot } from "../src/storage.js";

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
      wrongCount: 2,
      wrongTypeBreakdown: {
        "subtraction-borrow-2": 2
      },
      perTypeStats: [
        { typeId: "subtraction-borrow-2", totalAnswered: 10, totalCorrect: 8 }
      ]
    },
    createEmptySnapshot()
  );

  assert.deepEqual(recommendation, {
    title: "받아내림 2번",
    message: "받아내림 2번을 한 번 더 해보면 좋아요.",
    ctaLabel: "받아내림 2번 새 문제 10개",
    action: "start-type",
    typeId: "subtraction-borrow-2"
  });
});

test("result recommendation uses wrong-type retry for mixed sessions", () => {
  const recommendation = buildResultRecommendation(
    {
      sessionTypeId: MIXED_ALL_TYPE_ID,
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
    createEmptySnapshot()
  );

  assert.deepEqual(recommendation, {
    title: "틀린 유형만 다시",
    message: "받아내림 2번부터 틀린 유형만 다시 풀어봐요.",
    ctaLabel: "틀린 유형만 다시",
    action: "retry-wrong-types",
    typeIds: ["addition-carry-2", "subtraction-borrow-2"]
  });
});

test("result recommendation can step up after a perfect session", () => {
  const recommendation = buildResultRecommendation(
    {
      sessionTypeId: "addition-basic",
      wrongCount: 0,
      wrongTypeBreakdown: {},
      perTypeStats: [
        { typeId: "addition-basic", totalAnswered: 10, totalCorrect: 10 }
      ]
    },
    createEmptySnapshot()
  );

  assert.deepEqual(recommendation, {
    title: "받아올림 2번",
    message: "이번엔 받아올림 2번으로 한 단계 올려봐요.",
    ctaLabel: "받아올림 2번 새 문제 10개",
    action: "start-type",
    typeId: "addition-carry-2"
  });
});
