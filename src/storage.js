import {
  DEFAULT_TYPE_ID,
  PRACTICE_TYPES,
  STORAGE_KEY,
  isMixedSessionType
} from "./constants.js";

const HISTORY_LIMIT = 20;
const DAY_IN_MS = 24 * 60 * 60 * 1000;
const PRACTICE_TYPE_ORDER = PRACTICE_TYPES.map((type) => type.id);

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
    version: 3,
    stats: Object.fromEntries(
      PRACTICE_TYPES.map((type) => [type.id, createEmptyStat(type.id)])
    ),
    history: []
  };
}

function normalizeHistoryEntry(entry) {
  const sessionTypeId = entry?.sessionTypeId ?? entry?.typeId ?? DEFAULT_TYPE_ID;

  return {
    id: entry?.id ?? crypto.randomUUID(),
    sessionTypeId,
    typeId: sessionTypeId,
    sessionLabel: entry?.sessionLabel ?? null,
    accuracy: Number.isFinite(entry?.accuracy) ? entry.accuracy : 0,
    correctCount: Number.isFinite(entry?.correctCount) ? entry.correctCount : 0,
    totalCount: Number.isFinite(entry?.totalCount) ? entry.totalCount : 0,
    finishedAt: entry?.finishedAt ?? null,
    source: entry?.source ?? "fresh",
    focusedTypeIds: Array.isArray(entry?.focusedTypeIds) ? entry.focusedTypeIds : [],
    wrongTypeIds: Array.isArray(entry?.wrongTypeIds) ? entry.wrongTypeIds : [],
    typeBreakdown:
      entry?.typeBreakdown && typeof entry.typeBreakdown === "object" ? entry.typeBreakdown : {},
    wrongTypeBreakdown:
      entry?.wrongTypeBreakdown && typeof entry.wrongTypeBreakdown === "object"
        ? entry.wrongTypeBreakdown
        : {}
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
    version: 3,
    stats: nextStats,
    history: Array.isArray(rawSnapshot.history)
      ? rawSnapshot.history.slice(0, HISTORY_LIMIT).map(normalizeHistoryEntry)
      : []
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
  sessionResult.perTypeStats.forEach((typeStat) => {
    const currentStat = nextSnapshot.stats[typeStat.typeId] ?? createEmptyStat(typeStat.typeId);

    currentStat.totalAnswered += typeStat.totalAnswered;
    currentStat.totalCorrect += typeStat.totalCorrect;
    currentStat.sessions += 1;
    currentStat.lastAccuracy = Math.round(
      (typeStat.totalCorrect / typeStat.totalAnswered) * 100
    );
    currentStat.lastPracticedAt = sessionResult.finishedAt;
    nextSnapshot.stats[typeStat.typeId] = currentStat;
  });

  nextSnapshot.history.unshift({
    id: sessionResult.id,
    sessionTypeId: sessionResult.sessionTypeId,
    typeId: sessionResult.sessionTypeId,
    sessionLabel: sessionResult.sessionMeta?.label ?? null,
    accuracy: sessionResult.accuracy,
    correctCount: sessionResult.correctCount,
    totalCount: sessionResult.totalCount,
    finishedAt: sessionResult.finishedAt,
    source: sessionResult.source,
    focusedTypeIds: sessionResult.focusedTypeIds ?? [],
    wrongTypeIds: sessionResult.wrongTypeIds,
    typeBreakdown: sessionResult.typeBreakdown,
    wrongTypeBreakdown: sessionResult.wrongTypeBreakdown
  });
  nextSnapshot.history = nextSnapshot.history.slice(0, HISTORY_LIMIT);

  return nextSnapshot;
}

function toTimestamp(dateText) {
  const timestamp = Date.parse(dateText ?? "");
  return Number.isFinite(timestamp) ? timestamp : null;
}

function isRecentEntry(entry, days, now) {
  const finishedAt = toTimestamp(entry?.finishedAt);
  if (finishedAt === null) {
    return false;
  }

  const nowTimestamp = now instanceof Date ? now.getTime() : toTimestamp(now);
  if (nowTimestamp === null) {
    return false;
  }

  const threshold = nowTimestamp - days * DAY_IN_MS;
  return finishedAt >= threshold && finishedAt <= nowTimestamp;
}

function createRecentTypeStat(typeId) {
  return {
    typeId,
    totalAnswered: 0,
    totalCorrect: 0,
    totalWrong: 0,
    lastPracticedAt: null
  };
}

function compareRecentTypeStats(left, right, countKey) {
  const countGap = right[countKey] - left[countKey];
  if (countGap !== 0) {
    return countGap;
  }

  const accuracyGap = getAccuracy(left) - getAccuracy(right);
  if (accuracyGap !== 0) {
    return accuracyGap;
  }

  const recencyGap = (right.lastPracticedAt ?? "").localeCompare(left.lastPracticedAt ?? "");
  if (recencyGap !== 0) {
    return recencyGap;
  }

  return PRACTICE_TYPE_ORDER.indexOf(left.typeId) - PRACTICE_TYPE_ORDER.indexOf(right.typeId);
}

function getRecentTypeStatsFromEntries(entries) {
  const statsByType = Object.fromEntries(
    PRACTICE_TYPES.map((type) => [type.id, createRecentTypeStat(type.id)])
  );

  entries.forEach((entry) => {
    PRACTICE_TYPE_ORDER.forEach((typeId) => {
      const totalAnswered = Number(entry?.typeBreakdown?.[typeId] ?? 0);
      if (totalAnswered <= 0) {
        return;
      }

      const totalWrong = Number(entry?.wrongTypeBreakdown?.[typeId] ?? 0);
      const typeStat = statsByType[typeId];

      typeStat.totalAnswered += totalAnswered;
      typeStat.totalWrong += totalWrong;
      typeStat.totalCorrect += Math.max(totalAnswered - totalWrong, 0);
      if ((entry.finishedAt ?? "") > (typeStat.lastPracticedAt ?? "")) {
        typeStat.lastPracticedAt = entry.finishedAt;
      }
    });
  });

  return PRACTICE_TYPE_ORDER.map((typeId) => statsByType[typeId]).filter(
    (typeStat) => typeStat.totalAnswered > 0
  );
}

export function getRecentHistoryEntries(snapshot, options = {}) {
  const { days = 7, now = new Date() } = options;

  return (snapshot?.history ?? []).filter((entry) => isRecentEntry(entry, days, now));
}

export function getRecentTypeStats(snapshot, options = {}) {
  return getRecentTypeStatsFromEntries(getRecentHistoryEntries(snapshot, options));
}

export function getRecentSingleTypeSessions(snapshot, typeId, options = {}) {
  const { limit = 3, days = null, now = new Date() } = options;

  return (snapshot?.history ?? [])
    .filter((entry) => !isMixedSessionType(entry.sessionTypeId) && entry.sessionTypeId === typeId)
    .filter((entry) => (days ? isRecentEntry(entry, days, now) : true))
    .slice(0, limit);
}

export function getLastSevenDaySummary(snapshot, options = {}) {
  const recentEntries = getRecentHistoryEntries(snapshot, { days: 7, ...options });
  const recentTypeStats = getRecentTypeStatsFromEntries(recentEntries);
  const totalProblemCount = recentEntries.reduce(
    (sum, entry) => sum + Number(entry.totalCount ?? 0),
    0
  );
  const totalCorrectCount = recentEntries.reduce(
    (sum, entry) => sum + Number(entry.correctCount ?? 0),
    0
  );
  const mostPracticedTypeId =
    [...recentTypeStats].sort((left, right) => compareRecentTypeStats(left, right, "totalAnswered"))[0]
      ?.typeId ?? null;
  const mostWrongTypeId =
    [...recentTypeStats]
      .filter((typeStat) => typeStat.totalWrong > 0)
      .sort((left, right) => compareRecentTypeStats(left, right, "totalWrong"))[0]?.typeId ?? null;

  return {
    practiceCount: recentEntries.length,
    totalProblemCount,
    totalCorrectCount,
    averageAccuracy:
      totalProblemCount > 0 ? Math.round((totalCorrectCount / totalProblemCount) * 100) : null,
    mostPracticedTypeId,
    mostWrongTypeId,
    distinctTypeCount: recentTypeStats.length,
    typeStats: recentTypeStats
  };
}

export function getWeakestTypeId(snapshot) {
  return getWeakestTypeIds(snapshot, 1)[0] ?? null;
}

export function getWeakestTypeIds(snapshot, limit = 2) {
  const attemptedStats = Object.values(snapshot.stats).filter((stat) => stat.totalAnswered > 0);

  if (attemptedStats.length === 0) {
    return [];
  }

  return attemptedStats
    .sort((left, right) => {
      const accuracyGap = getAccuracy(left) - getAccuracy(right);
      if (accuracyGap !== 0) {
        return accuracyGap;
      }
      const wrongGap =
        right.totalAnswered - right.totalCorrect - (left.totalAnswered - left.totalCorrect);
      if (wrongGap !== 0) {
        return wrongGap;
      }
      return (left.lastPracticedAt ?? "").localeCompare(right.lastPracticedAt ?? "");
    })
    .slice(0, limit)
    .map((stat) => stat.typeId);
}

export function getRecommendedTypeId(snapshot) {
  const recentSummary = getLastSevenDaySummary(snapshot);

  return (
    recentSummary.mostWrongTypeId ??
    recentSummary.mostPracticedTypeId ??
    getWeakestTypeId(snapshot) ??
    snapshot.history[0]?.typeId ??
    DEFAULT_TYPE_ID
  );
}

export function getRecentSummary(snapshot) {
  return snapshot.history[0] ?? null;
}
