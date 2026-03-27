# Codex Prompt 02 — 원재 연산앱 2차 정리

```text
[작업 유형]
- 1차 구현 정리 / 2차 수정

[프로젝트]
- 경로: /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app

[먼저 읽을 문서]
1. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/PRD.md
2. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/TASKS.md
3. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/problem-generation-rules.md
4. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/STITCH-REVIEW.md
5. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/README.md
6. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/CHANGELOG.md

[현재 평가 요약]
- 문제 생성 규칙 정확성은 강하게 통과
- UI 방향은 좋지만 초3 기준 문구와 시각 구분을 더 다듬을 필요가 있음
- Stitch 반영은 간접적이므로 구조 반영을 더 또렷하게 만들 여지가 있음

[이번 루프 목표]
1. 아이 친화 문구 정리
2. 유형 카드 시각 구분 강화
3. 문제 풀이 화면 학습성 보강
4. 3자리 덧셈 기본 설명 보정
5. 프로젝트 정리(.omx 제외 등)

[핵심 수정 지시]
## 1. 문구 정리
- 홈, 유형 선택, 문제 풀이, 결과 화면 문구를 더 짧고 쉬운 말로 바꿔라.
- 초3 아이가 혼자 읽어도 바로 이해할 수 있게 하라.
- 설명 문장을 줄이고, 행동 버튼 문구를 더 단순하게 하라.

## 2. 유형 카드 구분 강화
- 덧셈과 뺄셈 그룹 구분을 더 분명하게 하라.
- 받아올림 / 받아내림 유형 카드가 서로 헷갈리지 않게 시각 구분을 보강하라.
- 카드 설명은 한 줄 또는 매우 짧은 두 줄 수준으로 압축하라.

## 3. 문제 풀이 화면 보강
- 현재 유형과 문제 번호가 더 바로 눈에 들어오게 하라.
- 자리값 보드가 초3 기준으로 더 읽기 쉽게 보이도록 정리하라.
- 피드백 문구는 짧고 반복 가능한 표현으로 단순화하라.

## 4. 설명 정밀화
- `3자리 덧셈`은 현재 구현상 받아올림 없는 기본형임을 UI/README에서 더 분명하게 하라.
- 유형 이름과 실제 규칙 설명이 어긋나지 않게 하라.

## 5. 프로젝트 정리
- `.gitignore`에 `.omx/`를 추가하라.
- 불필요한 산출물/환경 흔적이 커밋 대상에 들어가지 않게 정리하라.
- README / TASKS / CHANGELOG도 현재 2차 결과에 맞게 갱신하라.

[범위 제한]
- 문제 생성 규칙 자체를 크게 바꾸지 말 것
- 기능 확장보다 정리와 명확화에 집중할 것
- 부모 대시보드, PDF, 음성, AI 해설 추가 금지

[산출물 요구]
1. 변경 파일 목록
2. 아이 친화 문구로 바꾼 핵심 예시
3. 유형 카드 구분을 어떻게 더 분명하게 했는지
4. 문제 풀이 화면에서 무엇이 더 읽기 쉬워졌는지
5. 남은 리스크
6. 실행/검증 방법

[검증]
가능하면 수행하라.
- npm test
- npm run build

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic MVP second refinement completed" --mode now
```