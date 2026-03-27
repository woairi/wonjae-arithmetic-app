import { DEFAULT_TYPE_ID, PRACTICE_TYPES, SESSION_SIZE, getPracticeType } from "./constants.js";

const POSITION_LABELS = ["일의 자리", "십의 자리", "백의 자리"];

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function digitsOf(value) {
  return {
    ones: value % 10,
    tens: Math.floor(value / 10) % 10,
    hundreds: Math.floor(value / 100) % 10
  };
}

function createAdditionProblem(typeId, left, right) {
  const analysis = analyzeAddition(left, right);
  return {
    id: crypto.randomUUID(),
    typeId,
    operator: "+",
    left,
    right,
    answer: left + right,
    analysis
  };
}

function createSubtractionProblem(typeId, left, right) {
  const analysis = analyzeSubtraction(left, right);
  return {
    id: crypto.randomUUID(),
    typeId,
    operator: "-",
    left,
    right,
    answer: left - right,
    analysis
  };
}

export function analyzeAddition(left, right) {
  const leftDigits = digitsOf(left);
  const rightDigits = digitsOf(right);
  let carry = 0;
  const carryPositions = [];

  [
    [leftDigits.ones, rightDigits.ones, "일의 자리"],
    [leftDigits.tens, rightDigits.tens, "십의 자리"],
    [leftDigits.hundreds, rightDigits.hundreds, "백의 자리"]
  ].forEach(([first, second, label]) => {
    const sum = first + second + carry;
    if (sum >= 10) {
      carryPositions.push(label);
      carry = 1;
      return;
    }
    carry = 0;
  });

  return {
    carryCount: carryPositions.length,
    carryPositions,
    borrowCount: 0,
    borrowPositions: []
  };
}

export function analyzeSubtraction(left, right) {
  const leftDigits = digitsOf(left);
  const rightDigits = digitsOf(right);
  let borrow = 0;
  const borrowPositions = [];

  [
    [leftDigits.ones, rightDigits.ones, "일의 자리"],
    [leftDigits.tens, rightDigits.tens, "십의 자리"],
    [leftDigits.hundreds, rightDigits.hundreds, "백의 자리"]
  ].forEach(([topDigit, bottomDigit, label]) => {
    const available = topDigit - borrow;
    if (available < bottomDigit) {
      borrowPositions.push(label);
      borrow = 1;
      return;
    }
    borrow = 0;
  });

  return {
    carryCount: 0,
    carryPositions: [],
    borrowCount: borrowPositions.length,
    borrowPositions
  };
}

export function analyzeProblem(problem) {
  if (problem.operator === "+") {
    return analyzeAddition(problem.left, problem.right);
  }

  return analyzeSubtraction(problem.left, problem.right);
}

export function isValidForType(problem, typeId) {
  const analysis = analyzeProblem(problem);
  const bothThreeDigits =
    problem.left >= 100 &&
    problem.left <= 999 &&
    problem.right >= 100 &&
    problem.right <= 999;

  if (!bothThreeDigits) {
    return false;
  }

  switch (typeId) {
    case "addition-basic":
      return (
        problem.operator === "+" &&
        analysis.carryCount === 0 &&
        analysis.borrowCount === 0
      );
    case "addition-carry-2":
      return (
        problem.operator === "+" &&
        analysis.carryCount === 2 &&
        analysis.carryPositions.join(",") === POSITION_LABELS.slice(0, 2).join(",")
      );
    case "addition-carry-3":
      return (
        problem.operator === "+" &&
        analysis.carryCount === 3 &&
        analysis.carryPositions.join(",") === POSITION_LABELS.join(",")
      );
    case "subtraction-borrow-1":
      return (
        problem.operator === "-" &&
        problem.left > problem.right &&
        analysis.borrowCount === 1 &&
        analysis.borrowPositions[0] === "일의 자리"
      );
    case "subtraction-borrow-2":
      return (
        problem.operator === "-" &&
        problem.left > problem.right &&
        analysis.borrowCount === 2 &&
        analysis.borrowPositions.join(",") === POSITION_LABELS.slice(0, 2).join(",")
      );
    default:
      return false;
  }
}

function generateAdditionBasicCandidate() {
  const onesLeft = randomInt(0, 9);
  const onesRight = randomInt(0, 9 - onesLeft);
  const tensLeft = randomInt(0, 9);
  const tensRight = randomInt(0, 9 - tensLeft);
  const hundredsLeft = randomInt(1, 8);
  const hundredsRight = randomInt(1, 9 - hundredsLeft);

  return createAdditionProblem(
    "addition-basic",
    hundredsLeft * 100 + tensLeft * 10 + onesLeft,
    hundredsRight * 100 + tensRight * 10 + onesRight
  );
}

function generateAdditionCarryTwoCandidate() {
  const onesLeft = randomInt(1, 9);
  const onesRight = randomInt(Math.max(10 - onesLeft, 0), 9);
  const tensLeft = randomInt(0, 9);
  const tensRight = randomInt(Math.max(9 - tensLeft, 0), 9);
  const hundredsLeft = randomInt(1, 7);
  const hundredsRight = randomInt(1, 8 - hundredsLeft);

  return createAdditionProblem(
    "addition-carry-2",
    hundredsLeft * 100 + tensLeft * 10 + onesLeft,
    hundredsRight * 100 + tensRight * 10 + onesRight
  );
}

function generateAdditionCarryThreeCandidate() {
  const onesLeft = randomInt(1, 9);
  const onesRight = randomInt(Math.max(10 - onesLeft, 0), 9);
  const tensLeft = randomInt(0, 9);
  const tensRight = randomInt(Math.max(9 - tensLeft, 0), 9);
  const hundredsLeft = randomInt(1, 9);
  const hundredsRight = randomInt(Math.max(9 - hundredsLeft, 1), 9);

  return createAdditionProblem(
    "addition-carry-3",
    hundredsLeft * 100 + tensLeft * 10 + onesLeft,
    hundredsRight * 100 + tensRight * 10 + onesRight
  );
}

function generateSubtractionBorrowOneCandidate() {
  const onesLeft = randomInt(0, 8);
  const onesRight = randomInt(onesLeft + 1, 9);
  const tensLeft = randomInt(1, 9);
  const tensRight = randomInt(0, tensLeft - 1);
  const hundredsLeft = randomInt(1, 9);
  const hundredsRight = randomInt(1, hundredsLeft);

  return createSubtractionProblem(
    "subtraction-borrow-1",
    hundredsLeft * 100 + tensLeft * 10 + onesLeft,
    hundredsRight * 100 + tensRight * 10 + onesRight
  );
}

function generateSubtractionBorrowTwoCandidate() {
  const onesLeft = randomInt(0, 8);
  const onesRight = randomInt(onesLeft + 1, 9);
  const tensLeft = randomInt(0, 8);
  const tensRight = randomInt(tensLeft, 9);
  const hundredsLeft = randomInt(2, 9);
  const hundredsRight = randomInt(1, hundredsLeft - 1);

  return createSubtractionProblem(
    "subtraction-borrow-2",
    hundredsLeft * 100 + tensLeft * 10 + onesLeft,
    hundredsRight * 100 + tensRight * 10 + onesRight
  );
}

const candidateFactories = {
  "addition-basic": generateAdditionBasicCandidate,
  "addition-carry-2": generateAdditionCarryTwoCandidate,
  "addition-carry-3": generateAdditionCarryThreeCandidate,
  "subtraction-borrow-1": generateSubtractionBorrowOneCandidate,
  "subtraction-borrow-2": generateSubtractionBorrowTwoCandidate
};

export function generateProblem(typeId = DEFAULT_TYPE_ID) {
  const candidateFactory = candidateFactories[typeId];

  for (let attempt = 0; attempt < 200; attempt += 1) {
    const problem = candidateFactory();
    if (isValidForType(problem, typeId)) {
      return problem;
    }
  }

  const practiceType = getPracticeType(typeId);
  throw new Error(`${practiceType.label} 문제 생성에 실패했습니다.`);
}

export function generateSessionProblems(typeId, size = SESSION_SIZE) {
  return Array.from({ length: size }, () => generateProblem(typeId));
}

export function resetProblemForRetry(problem) {
  return {
    ...problem,
    id: crypto.randomUUID(),
    inputValue: "",
    submitted: false,
    isCorrect: false,
    feedback: ""
  };
}

export function enrichProblem(problem) {
  return {
    ...problem,
    inputValue: "",
    submitted: false,
    isCorrect: false,
    feedback: ""
  };
}

export function createFreshSession(typeId, size = SESSION_SIZE) {
  return {
    typeId,
    source: "fresh",
    problems: generateSessionProblems(typeId, size).map(enrichProblem),
    currentIndex: 0,
    validationMessage: ""
  };
}

export function createRetrySession(typeId, problems) {
  return {
    typeId,
    source: "retry",
    problems: problems.map(resetProblemForRetry),
    currentIndex: 0,
    validationMessage: ""
  };
}

export function getHintMessage(problem) {
  const practiceType = PRACTICE_TYPES.find((type) => type.id === problem.typeId);
  const positions =
    problem.operator === "+"
      ? problem.analysis.carryPositions
      : problem.analysis.borrowPositions;

  if (positions.length === 0) {
    return practiceType?.hint ?? "자리값을 다시 봐요.";
  }

  const action = problem.operator === "+" ? "올림" : "내림";
  return `${positions.join(", ")} ${action}을 다시 봐요.`;
}
