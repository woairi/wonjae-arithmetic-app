# Codex Prompt 08 — 세션/기록 관리 + 세션 UX 마감

```text
[작업 유형]
- 사용성 마감 / 기록 관리 기능 추가

[프로젝트]
- 경로: /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app

[먼저 읽을 문서]
1. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/PRD.md
2. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/TASKS.md
3. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/README.md
4. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/CHANGELOG.md
5. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/RUNLOG.md

[이번 루프 목표]
- 기록과 세션을 실제 사용 가능한 수준으로 관리할 수 있게 한다.
- 문제 풀이/결과 화면의 흐름을 더 매끄럽게 마감한다.

[핵심 기능]
## 1. 기록/세션 관리
- 아래 중 현실적인 범위로 구현하라.
  - 전체 기록 초기화
  - 최근 기록 초기화
  - 특정 세션 삭제
- 최소한 하나 이상의 정리 기능은 들어가야 한다.
- 삭제/초기화 전에는 실수 방지 확인 단계를 둬라.
- 보호자가 봐도 의미가 분명한 문구로 써라.

## 2. 세션 UX 마감
- 문제 입력과 다음 문제 흐름을 더 매끄럽게 다듬어라.
- 숫자 입력 후 제출/다음 이동 흐름이 답답하지 않게 하라.
- 결과 화면에서 추천된 다음 연습 시작 흐름이 더 짧게 이어지게 하라.
- 포커스/버튼 우선순위/입력 상태를 정리하라.

## 3. 홈/기록 화면 연결 정리
- 기록 관리 기능이 홈/최근 학습 기록 화면에서 자연스럽게 보이게 하라.
- 보호자 요약과 기록 관리가 너무 섞이지 않게 하라.

[범위 제한]
- 로그인/서버 추가 금지
- PDF/출력 금지
- 음성/AI 해설 금지
- 대형 설정 페이지 금지

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
- 기록 삭제/초기화 흐름과 세션 전환 흐름 확인

[산출물 요구]
1. 변경 파일 목록
2. 어떤 기록 관리 기능을 넣었는지
3. 세션 UX에서 무엇이 좋아졌는지
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic session management and UX polish completed" --mode now
```