# Codex Prompt 04 — 오답 복습 강화 + 보호자 요약 최소 버전

```text
[작업 유형]
- 기능 확장 / 학습 효과 강화

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
- 오답 복습을 더 학습 효과 있게 만든다.
- 보호자/형근이 약한 유형을 빠르게 파악할 수 있는 최소 요약을 추가한다.

[핵심 기능]
## 1. 오답 복습 강화
- 결과 화면에서 `틀린 문제 다시` 외에 아래 중 최소 1~2개를 추가하라.
  - 틀린 유형만 다시 풀기
  - 같은 유형 새 문제 다시 10개
- 혼합 모드에서도 틀린 실제 유형을 기준으로 다시 연습할 수 있게 하라.
- 오답 힌트는 지금보다 약간 더 구체적으로 하되, 여전히 짧게 유지하라.
  - 예: `일 자리 올림 다시`, `십 자리 내림 다시` 수준

## 2. 보호자용 최소 요약
- 홈 또는 별도 요약 영역에서 아래가 보이게 하라.
  - 최근 연습 횟수
  - 유형별 정답률 요약
  - 가장 약한 유형 1~2개
  - 오늘 추천 유형
- 너무 복잡한 대시보드로 만들지 말고, 카드 몇 개 수준의 최소 요약으로 유지하라.

## 3. 결과 화면 보강
- 이번 세션에서 특히 약했던 유형이 더 눈에 들어오게 하라.
- 혼합 모드라면 어떤 유형에서 많이 틀렸는지 짧게 보여줘라.

[범위 제한]
- 로그인/서버 추가 금지
- 부모 전용 별도 페이지 대형 구현 금지
- PDF/출력 금지
- 음성/AI 해설 금지
- 게임화 과잉 금지

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
- 혼합 모드와 단일 유형 모드 모두에서 오답 복습 흐름 확인

[산출물 요구]
1. 변경 파일 목록
2. 오답 복습 강화 방식 설명
3. 보호자용 최소 요약에 추가한 정보 설명
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic retry and summary improvements completed" --mode now
```