import { DEFAULT_TYPE_ID, PRACTICE_TYPES, STORAGE_KEY } from "./constants.js";

function createEmptyStat(typeId) {
  return {
    typeId,
    totalAnswered: 0,
    totalCorrect: 0,
    sessions: 0,
    lastAccuracy: 0,
    lastPracticedAt: null
  };
}

export function createEmptySnapshot() {
  return {
    version: 1,
    stats: Object.fromEntries(
      PRACTICE_TYPES.map((type) => [type.id, createEmptyStat(type.id)])
    ),
    history: []
  };
}

function normalizeSnapshot(rawSnapshot) {
  const emptySnapshot = createEmptySnapshot();

  if (!rawSnapshot || typeof rawSnapshot !== "object") {
    return emptySnapshot;
  }

  const nextStats = { ...emptySnapshot.stats };
  PRACTICE_TYPES.forEach((type) => {
    const savedStat = rawSnapshot.stats?.[type.id];
    nextStats[type.id] = {
      ...createEmptyStat(type.id),
      ...savedStat,
      typeId: type.id
    };
  });

  return {
    version: 1,
    stats: nextStats,
    history: Array.isArray(rawSnapshot.history) ? rawSnapshot.history.slice(0, 20) : []
  };
}

export function loadSnapshot() {
  try {
    const rawText = localStorage.getItem(STORAGE_KEY);
    if (!rawText) {
      return createEmptySnapshot();
    }
    return normalizeSnapshot(JSON.parse(rawText));
  } catch {
    return createEmptySnapshot();
  }
}

export function saveSnapshot(snapshot) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
}

export function getAccuracy(stat) {
  if (!stat || stat.totalAnswered === 0) {
    return 0;
  }
  return Math.round((stat.totalCorrect / stat.totalAnswered) * 100);
}

export function recordSession(snapshot, sessionResult) {
  const nextSnapshot = normalizeSnapshot(snapshot);
  const currentStat = nextSnapshot.stats[sessionResult.typeId] ?? createEmptyStat(sessionResult.typeId);

  currentStat.totalAnswered += sessionResult.totalCount;
  currentStat.totalCorrect += sessionResult.correctCount;
  currentStat.sessions += 1;
  currentStat.lastAccuracy = sessionResult.accuracy;
  currentStat.lastPracticedAt = sessionResult.finishedAt;
  nextSnapshot.stats[sessionResult.typeId] = currentStat;

  nextSnapshot.history.unshift({
    id: sessionResult.id,
    typeId: sessionResult.typeId,
    accuracy: sessionResult.accuracy,
    correctCount: sessionResult.correctCount,
    totalCount: sessionResult.totalCount,
    finishedAt: sessionResult.finishedAt,
    source: sessionResult.source
  });
  nextSnapshot.history = nextSnapshot.history.slice(0, 20);

  return nextSnapshot;
}

export function getWeakestTypeId(snapshot) {
  const attemptedStats = Object.values(snapshot.stats).filter(
    (stat) => stat.totalAnswered > 0
  );

  if (attemptedStats.length === 0) {
    return null;
  }

  return attemptedStats
    .sort((left, right) => {
      const accuracyGap = getAccuracy(left) - getAccuracy(right);
      if (accuracyGap !== 0) {
        return accuracyGap;
      }
      return (left.lastPracticedAt ?? "").localeCompare(right.lastPracticedAt ?? "");
    })[0]
    .typeId;
}

export function getRecommendedTypeId(snapshot) {
  return getWeakestTypeId(snapshot) ?? snapshot.history[0]?.typeId ?? DEFAULT_TYPE_ID;
}

export function getRecentSummary(snapshot) {
  return snapshot.history[0] ?? null;
}
