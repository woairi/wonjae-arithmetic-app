import test from "node:test";
import assert from "node:assert/strict";

import {
  analyzeAddition,
  analyzeSubtraction,
  generateProblem,
  isValidForType
} from "../src/problem-engine.js";
import { PRACTICE_TYPES, getPracticeType } from "../src/constants.js";

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

test("practice type copy stays aligned with rule-critical distinctions", () => {
  const basicAddition = getPracticeType("addition-basic");
  assert.equal(basicAddition.description.includes("받아올림 없이"), true);
  assert.equal(basicAddition.summary, "받아올림 없는 덧셈");

  assert.equal(getPracticeType("addition-carry-2").cardRule, "일, 십");
  assert.equal(getPracticeType("addition-carry-3").cardRule, "일, 십, 백");
  assert.equal(getPracticeType("subtraction-borrow-1").cardRule, "일");
  assert.equal(getPracticeType("subtraction-borrow-2").cardRule, "일, 십");
});
