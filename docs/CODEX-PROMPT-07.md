# Codex Prompt 07 — 최근 7일 요약 + 추천 고도화

```text
[작업 유형]
- 학습 리포트 강화 / 추천 로직 개선

[프로젝트]
- 경로: /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app

[먼저 읽을 문서]
1. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/PRD.md
2. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/TASKS.md
3. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/README.md
4. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/CHANGELOG.md
5. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/problem-generation-rules.md
6. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/RUNLOG.md

[이번 루프 목표]
- 최근 7일 학습 흐름을 한눈에 볼 수 있게 한다.
- 다음 추천 유형을 지금보다 더 자연스럽고 똑똑하게 만든다.

[핵심 기능]
## 1. 최근 7일 요약
- 홈 또는 최근 기록 화면에서 최근 7일 기준 요약 카드를 추가하라.
- 최소한 아래를 보여라.
  - 최근 7일 연습 횟수
  - 가장 많이 푼 유형
  - 가장 많이 틀린 유형
  - 최근 7일 평균 정확도 또는 대표 정확도
- 큰 차트보다 카드형 요약을 우선한다.

## 2. 추천 로직 고도화
- 지금 추천보다 더 자연스럽게 다음 연습을 제안하라.
- 예를 들면 아래 요소를 반영할 수 있다.
  - 최근 3회 또는 최근 7일 기준 약한 유형
  - 연속 성공 시 다음 단계 유형 제안
  - 혼합 모드와 단일 유형 추천 분리
  - 너무 어려운 유형만 반복 추천하지 않도록 균형
- 추천 이유가 짧게 보이면 좋다.

## 3. 보호자/아이 모두 읽기 쉬운 구조 유지
- 설명은 짧게
- 숫자와 핵심 요약이 먼저 보이게
- 대시보드 과밀화 금지

[범위 제한]
- 로그인/서버 추가 금지
- PDF/출력 금지
- 음성/AI 해설 금지
- 복잡한 차트 라이브러리 금지

[문서 반영]
- README.md
- TASKS.md
- CHANGELOG.md
- 필요 시 docs/RUNLOG.md
갱신

[검증]
가능하면 수행하라.
- npm test
- npm run build
- 최근 7일 요약 계산과 추천 로직 분기 확인

[산출물 요구]
1. 변경 파일 목록
2. 최근 7일 요약에서 무엇을 보여주는지
3. 추천 로직이 어떻게 달라졌는지
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic weekly summary and smarter recommendation added" --mode now
```