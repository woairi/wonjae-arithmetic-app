export const SESSION_SIZE = 10;
export const STORAGE_KEY = "wonjae-arithmetic-app-v1";
export const PLACE_LABELS = ["천", "백", "십", "일"];
export const MIXED_ALL_TYPE_ID = "mixed-all";

export const PRACTICE_TYPES = [
  {
    id: "addition-basic",
    group: "덧셈",
    label: "3자리 덧셈",
    description: "받아올림 없이 더해요.",
    summary: "받아올림 없는 덧셈",
    cardRule: "올림 없음",
    hint: "백, 십, 일을 차례로 더해요."
  },
  {
    id: "addition-carry-2",
    group: "덧셈",
    label: "받아올림 2번",
    description: "일, 십 자리에서 올림해요.",
    summary: "받아올림 2번 덧셈",
    cardRule: "일, 십",
    hint: "일 자리와 십 자리를 먼저 봐요."
  },
  {
    id: "addition-carry-3",
    group: "덧셈",
    label: "받아올림 3번",
    description: "세 자리 모두 올림해요.",
    summary: "받아올림 3번 덧셈",
    cardRule: "일, 십, 백",
    hint: "모든 자리에 올림이 있는지 봐요."
  },
  {
    id: "subtraction-borrow-1",
    group: "뺄셈",
    label: "받아내림 1번",
    description: "일 자리에서만 내려요.",
    summary: "받아내림 1번 뺄셈",
    cardRule: "일",
    hint: "일 자리만 먼저 확인해요."
  },
  {
    id: "subtraction-borrow-2",
    group: "뺄셈",
    label: "받아내림 2번",
    description: "일, 십 자리에서 내려요.",
    summary: "받아내림 2번 뺄셈",
    cardRule: "일, 십",
    hint: "일 자리와 십 자리를 이어서 봐요."
  }
];

export const MIXED_ALL_TYPE = {
  id: MIXED_ALL_TYPE_ID,
  group: "섞어 풀기",
  label: "전체 유형 랜덤",
  description: "5개 유형이 섞여 나와요.",
  summary: "5개 실제 유형이 섞여 나오는 연습",
  cardRule: "랜덤",
  hint: "이번 문제의 실제 유형을 보고 풀어요."
};

export const SESSION_TYPE_OPTIONS = [MIXED_ALL_TYPE, ...PRACTICE_TYPES];
export const DEFAULT_TYPE_ID = PRACTICE_TYPES[0].id;

export function getPracticeType(typeId) {
  return PRACTICE_TYPES.find((type) => type.id === typeId) ?? PRACTICE_TYPES[0];
}

export function getSessionType(typeId) {
  return SESSION_TYPE_OPTIONS.find((type) => type.id === typeId) ?? getPracticeType(DEFAULT_TYPE_ID);
}

export function isMixedSessionType(typeId) {
  return typeId === MIXED_ALL_TYPE_ID;
}
