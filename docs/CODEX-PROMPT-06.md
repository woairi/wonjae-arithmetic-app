# Codex Prompt 06 — 단계형 힌트 + 결과 추천 강화

```text
[작업 유형]
- 학습 보조 강화 / 결과 화면 개선

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
- 자리값 힌트를 단계적으로 보여준다.
- 결과 화면에서 다음 추천 연습을 더 자연스럽게 제안한다.

[핵심 기능]
## 1. 단계형 힌트
- 현재 힌트 on/off를 2단계 또는 3단계 구조로 확장하라.
- 예시 방향:
  - 0단계: 힌트 숨김
  - 1단계: 어느 자리를 먼저 볼지 표시
  - 2단계: 올림/내림이 생기는 자리를 더 직접적으로 보여주기
- UI는 너무 복잡하지 않게 유지하라.
- 문제 화면에서 단계가 바뀔 때 아이가 차이를 바로 이해할 수 있어야 한다.

## 2. 결과 화면 추천 강화
- 이번 세션 결과를 바탕으로 다음 추천 연습 한 줄을 제공하라.
- 예:
  - `받아내림 2번을 한 번 더 해보면 좋아요.`
  - `이번엔 올림 없는 덧셈으로 자신감을 다시 올려봐요.`
- 혼합 모드와 단일 유형 모드에서 각각 자연스럽게 작동하게 하라.
- 결과 화면 CTA와 추천 문구가 서로 잘 연결되게 하라.

## 3. 문구 톤 유지
- 초3 기준으로 짧고 쉬운 문구 유지
- 설명이 길어지지 않게 주의
- 보호자도 뜻을 바로 이해할 수 있게 하라

[범위 제한]
- 로그인/서버 추가 금지
- PDF/출력 금지
- 음성/AI 해설 금지
- 대형 통계 대시보드 금지

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
- 힌트 단계 전환과 결과 추천 문구 확인

[산출물 요구]
1. 변경 파일 목록
2. 단계형 힌트를 어떻게 구성했는지
3. 결과 추천 문구 생성 방식 설명
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic staged hints and result guidance added" --mode now
```