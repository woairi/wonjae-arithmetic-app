import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeAddition,
  analyzeSubtraction,
  createFocusedTypeSession,
  createFreshSession,
  generateProblem,
  getHintMessage,
  isValidForType
} from "../src/problem-engine.js";
import {
  MIXED_ALL_TYPE_ID,
  PRACTICE_TYPES,
  getPracticeType,
  getSessionType
} from "../src/constants.js";

test("addition analysis counts carries correctly", () => {
  assert.deepEqual(analyzeAddition(123, 245).carryPositions, []);
  assert.deepEqual(analyzeAddition(278, 356).carryPositions, ["일의 자리", "십의 자리"]);
  assert.deepEqual(analyzeAddition(578, 456).carryPositions, [
    "일의 자리",
    "십의 자리",
    "백의 자리"
  ]);
});

test("subtraction analysis counts borrows correctly", () => {
  assert.deepEqual(analyzeSubtraction(352, 146).borrowPositions, ["일의 자리"]);
  assert.deepEqual(analyzeSubtraction(402, 178).borrowPositions, [
    "일의 자리",
    "십의 자리"
  ]);
});

test("every generated problem matches its declared type", () => {
  PRACTICE_TYPES.forEach((practiceType) => {
    for (let index = 0; index < 200; index += 1) {
      const problem = generateProblem(practiceType.id);

      assert.equal(isValidForType(problem, practiceType.id), true);
      assert.equal(problem.typeId, practiceType.id);
      assert.equal(problem.left >= 100 && problem.left <= 999, true);
      assert.equal(problem.right >= 100 && problem.right <= 999, true);
    }
  });
});

test("mixed-all session keeps actual problem types valid and visible", () => {
  const session = createFreshSession(MIXED_ALL_TYPE_ID, 10);
  const seenTypeIds = new Set(session.problems.map((problem) => problem.typeId));

  assert.equal(session.sessionTypeId, MIXED_ALL_TYPE_ID);
  assert.equal(session.problems.length, 10);

  PRACTICE_TYPES.forEach((practiceType) => {
    assert.equal(seenTypeIds.has(practiceType.id), true);
  });

  session.problems.forEach((problem) => {
    assert.equal(isValidForType(problem, problem.typeId), true);
  });
});

test("focused retry session only uses requested wrong types", () => {
  const focusedTypeIds = ["addition-carry-2", "subtraction-borrow-1"];
  const session = createFocusedTypeSession(focusedTypeIds, 10);
  const seenTypeIds = new Set(session.problems.map((problem) => problem.typeId));

  assert.equal(session.source, "focus-types");
  assert.equal(session.sessionMeta.label, "틀린 유형만 다시");
  focusedTypeIds.forEach((typeId) => {
    assert.equal(seenTypeIds.has(typeId), true);
  });

  session.problems.forEach((problem) => {
    assert.equal(focusedTypeIds.includes(problem.typeId), true);
    assert.equal(isValidForType(problem, problem.typeId), true);
  });
});

test("hint message stays short but points to carry and borrow positions", () => {
  assert.equal(
    getHintMessage({
      typeId: "addition-carry-2",
      operator: "+",
      analysis: { carryPositions: ["일의 자리", "십의 자리"], borrowPositions: [] }
    }),
    "일, 십 자리 올림 다시."
  );

  assert.equal(
    getHintMessage({
      typeId: "subtraction-borrow-1",
      operator: "-",
      analysis: { carryPositions: [], borrowPositions: ["일의 자리"] }
    }),
    "일 자리 내림 다시."
  );
});

test("practice type copy stays aligned with rule-critical distinctions", () => {
  const basicAddition = getPracticeType("addition-basic");
  assert.equal(basicAddition.description.includes("받아올림 없이"), true);
  assert.equal(basicAddition.summary, "받아올림 없는 덧셈");

  assert.equal(getPracticeType("addition-carry-2").cardRule, "일, 십");
  assert.equal(getPracticeType("addition-carry-3").cardRule, "일, 십, 백");
  assert.equal(getPracticeType("subtraction-borrow-1").cardRule, "일");
  assert.equal(getPracticeType("subtraction-borrow-2").cardRule, "일, 십");
  assert.equal(getSessionType(MIXED_ALL_TYPE_ID).label, "전체 유형 랜덤");
});
