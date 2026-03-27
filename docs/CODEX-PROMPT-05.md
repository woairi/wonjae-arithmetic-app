# Codex Prompt 05 — 자리값 힌트 + 최근 학습 기록

```text
[작업 유형]
- 학습 보조 강화 / 기록 화면 추가

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
- 문제 화면에서 자리값과 올림/내림 포인트를 더 쉽게 눈으로 이해하게 한다.
- 최근 학습 기록을 따로 볼 수 있게 만든다.

[핵심 기능]
## 1. 세로셈 힌트 on/off
- 문제 풀이 화면에 자리값 힌트 보기/숨기기 토글을 추가하라.
- 힌트를 켰을 때 자리값 보드가 더 또렷하게 읽히게 하라.
- 정답 판정 전/후 어느 자리에서 봐야 하는지 시각적으로 도울 수 있으면 좋다.
- 단, 너무 복잡하게 만들지 말고 MVP 수준의 학습 보조로 유지하라.

## 2. 오답 시 자리 포인트 시각화
- 오답이면 힌트 문구뿐 아니라, 가능하면 문제 보드에서 관련 자리(예: 일 자리, 십 자리)를 눈에 띄게 보여줘라.
- 올림/내림 자리 강조는 과하지 않게 하라.

## 3. 최근 학습 기록 화면 추가
- 홈에서 이동 가능한 `최근 학습 기록` 화면 또는 섹션을 추가하라.
- 최소한 아래를 보여라.
  - 최근 세션 목록
  - 어떤 유형/모드였는지
  - 정확도
  - 언제 했는지
- 혼합 모드/틀린 유형만 다시/같은 유형 다시 등도 레이블로 구분되면 좋다.

## 4. 홈과 연결
- 홈에서 최근 기록 보기 동선이 자연스럽게 보이게 하라.
- 보호자 요약과 최근 기록 화면 역할이 겹치지 않게 정리하라.

[범위 제한]
- 로그인/서버 추가 금지
- 부모 전용 대시보드 대형 확장 금지
- PDF/출력 금지
- 음성/AI 해설 금지
- 애니메이션 과잉 금지

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
- 힌트 토글과 최근 기록 화면 흐름 확인

[산출물 요구]
1. 변경 파일 목록
2. 자리값 힌트/강조를 어떻게 구현했는지
3. 최근 기록 화면 구조 설명
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic hints and history added" --mode now
```