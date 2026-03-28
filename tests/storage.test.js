import test from "node:test";
import assert from "node:assert/strict";

import {
  createEmptySnapshot,
  getLastSevenDaySummary,
  getWeakestTypeIds,
  recordSession
} from "../src/storage.js";

test("recordSession keeps labels and weakest type ordering for summaries", () => {
  const snapshot = createEmptySnapshot();
  const nextSnapshot = recordSession(snapshot, {
    id: "session-1",
    sessionTypeId: "mixed-all",
    sessionMeta: { label: "틀린 유형만 다시" },
    source: "focus-types",
    accuracy: 50,
    correctCount: 5,
    totalCount: 10,
    wrongTypeIds: ["addition-carry-2", "subtraction-borrow-2"],
    focusedTypeIds: ["addition-carry-2", "subtraction-borrow-2"],
    typeBreakdown: {
      "addition-carry-2": 5,
      "subtraction-borrow-2": 5
    },
    wrongTypeBreakdown: {
      "addition-carry-2": 3,
      "subtraction-borrow-2": 2
    },
    perTypeStats: [
      { typeId: "addition-carry-2", totalAnswered: 5, totalCorrect: 2 },
      { typeId: "subtraction-borrow-2", totalAnswered: 5, totalCorrect: 3 }
    ],
    finishedAt: "2026-03-27T10:00:00.000Z"
  });

  assert.equal(nextSnapshot.history[0].sessionLabel, "틀린 유형만 다시");
  assert.equal(nextSnapshot.history[0].source, "focus-types");
  assert.equal(nextSnapshot.history[0].accuracy, 50);
  assert.deepEqual(nextSnapshot.history[0].focusedTypeIds, [
    "addition-carry-2",
    "subtraction-borrow-2"
  ]);
  assert.deepEqual(nextSnapshot.history[0].typeBreakdown, {
    "addition-carry-2": 5,
    "subtraction-borrow-2": 5
  });
  assert.deepEqual(nextSnapshot.history[0].wrongTypeBreakdown, {
    "addition-carry-2": 3,
    "subtraction-borrow-2": 2
  });
  assert.deepEqual(getWeakestTypeIds(nextSnapshot, 2), [
    "addition-carry-2",
    "subtraction-borrow-2"
  ]);
});

test("last seven day summary aggregates practice count, top type, weak type, and accuracy", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "recent-1",
      sessionTypeId: "mixed-all",
      accuracy: 60,
      correctCount: 6,
      totalCount: 10,
      finishedAt: "2026-03-28T09:00:00.000Z",
      typeBreakdown: {
        "addition-carry-2": 6,
        "subtraction-borrow-2": 4
      },
      wrongTypeBreakdown: {
        "addition-carry-2": 2,
        "subtraction-borrow-2": 2
      }
    },
    {
      id: "recent-2",
      sessionTypeId: "addition-carry-2",
      accuracy: 80,
      correctCount: 8,
      totalCount: 10,
      finishedAt: "2026-03-25T09:00:00.000Z",
      typeBreakdown: {
        "addition-carry-2": 10
      },
      wrongTypeBreakdown: {
        "addition-carry-2": 2
      }
    },
    {
      id: "old-1",
      sessionTypeId: "addition-basic",
      accuracy: 100,
      correctCount: 10,
      totalCount: 10,
      finishedAt: "2026-03-18T09:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {}
    }
  ];

  const summary = getLastSevenDaySummary(snapshot, {
    now: new Date("2026-03-28T12:00:00.000Z")
  });

  assert.equal(summary.practiceCount, 2);
  assert.equal(summary.mostPracticedTypeId, "addition-carry-2");
  assert.equal(summary.mostWrongTypeId, "addition-carry-2");
  assert.equal(summary.averageAccuracy, 70);
});
