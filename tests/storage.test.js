import test from "node:test";
import assert from "node:assert/strict";

import {
  clearHistory,
  clearRecentHistory,
  createEmptySnapshot,
  getLastSevenDaySummary,
  getWeakestTypeIds,
  removeHistoryEntry,
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

test("removeHistoryEntry rebuilds cumulative stats from remaining sessions", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "recent-1",
      sessionTypeId: "addition-carry-2",
      accuracy: 70,
      correctCount: 7,
      totalCount: 10,
      finishedAt: "2026-03-28T09:00:00.000Z",
      typeBreakdown: {
        "addition-carry-2": 10
      },
      wrongTypeBreakdown: {
        "addition-carry-2": 3
      }
    },
    {
      id: "recent-2",
      sessionTypeId: "addition-basic",
      accuracy: 100,
      correctCount: 10,
      totalCount: 10,
      finishedAt: "2026-03-27T09:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {}
    }
  ];

  const nextSnapshot = removeHistoryEntry(snapshot, "recent-1");

  assert.equal(nextSnapshot.history.length, 1);
  assert.equal(nextSnapshot.history[0].id, "recent-2");
  assert.equal(nextSnapshot.stats["addition-carry-2"].totalAnswered, 0);
  assert.equal(nextSnapshot.stats["addition-basic"].totalAnswered, 10);
  assert.equal(nextSnapshot.stats["addition-basic"].totalCorrect, 10);
});

test("clearRecentHistory removes only recent sessions and recalculates summaries", () => {
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
        "addition-carry-2": 5,
        "subtraction-borrow-2": 5
      },
      wrongTypeBreakdown: {
        "addition-carry-2": 2,
        "subtraction-borrow-2": 2
      }
    },
    {
      id: "old-1",
      sessionTypeId: "addition-basic",
      accuracy: 90,
      correctCount: 9,
      totalCount: 10,
      finishedAt: "2026-03-15T09:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {
        "addition-basic": 1
      }
    }
  ];

  const nextSnapshot = clearRecentHistory(snapshot, {
    now: new Date("2026-03-28T12:00:00.000Z")
  });

  assert.deepEqual(
    nextSnapshot.history.map((entry) => entry.id),
    ["old-1"]
  );
  assert.equal(nextSnapshot.stats["addition-basic"].totalAnswered, 10);
  assert.equal(nextSnapshot.stats["addition-carry-2"].totalAnswered, 0);
  assert.equal(
    getLastSevenDaySummary(nextSnapshot, { now: new Date("2026-03-28T12:00:00.000Z") }).practiceCount,
    0
  );
});

test("clearHistory resets stats and history together", () => {
  const snapshot = createEmptySnapshot();
  snapshot.history = [
    {
      id: "recent-1",
      sessionTypeId: "addition-basic",
      accuracy: 80,
      correctCount: 8,
      totalCount: 10,
      finishedAt: "2026-03-28T09:00:00.000Z",
      typeBreakdown: {
        "addition-basic": 10
      },
      wrongTypeBreakdown: {
        "addition-basic": 2
      }
    }
  ];

  const nextSnapshot = clearHistory(snapshot);

  assert.equal(nextSnapshot.history.length, 0);
  assert.equal(nextSnapshot.stats["addition-basic"].totalAnswered, 0);
  assert.equal(nextSnapshot.stats["addition-basic"].totalCorrect, 0);
});
