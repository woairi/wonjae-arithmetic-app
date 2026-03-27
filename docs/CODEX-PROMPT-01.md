# Codex Prompt 01 — 원재 연산앱 MVP 1차 구현

```text
[작업 유형]
- 신규 교육용 모바일 웹 앱 초기 구현

[프로젝트]
- 경로: /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app
- 서비스명: 원재 연산앱
- 성격: 초3 대상 자리올림/자리내림 유형 분리 연산 훈련 앱

[먼저 읽을 문서]
1. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/PRD.md
2. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/TASKS.md
3. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/problem-generation-rules.md
4. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/UI-SPEC-STITCH.md
5. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/STITCH-STEP.md
6. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/README.md

[중요]
- 구현 전에 Stitch MCP를 사용해 핵심 화면 구조를 먼저 검토하라.
- 최소한 아래 4개 화면에 대해 Stitch MCP를 활용하라.
  1. 홈
  2. 유형 선택
  3. 문제 풀이
  4. 결과
- Stitch 결과를 그대로 복붙하지 말고, 실제 구현 가능한 모바일 UI로 정리해 반영하라.

[핵심 목표]
초3 아동이 연산 유형을 구분해서 반복 훈련할 수 있는 MVP를 만든다.
가장 중요한 것은 UI보다 문제 생성 규칙의 정확성이지만, 아동용 UI 흐름도 초기에 잘 잡아야 한다.

[반드시 지킬 범위]
- 유형 선택
  - 3자리 덧셈
  - 받아올림 2번
  - 받아올림 3번
  - 받아내림 1번
  - 받아내림 2번
- 문제 풀이 화면
- 정답/오답 판정
- 결과 화면
- 오답만 다시 풀기
- 유형별 정답률 로컬 저장
- 오늘 추천 연습 또는 약한 유형 추천의 기본 구조

[이번 루프에서 구현할 것]
1. 앱 초기 구조를 잡아라.
2. 모바일 웹 우선으로 화면을 만든다.
   - 홈
   - 유형 선택
   - 문제 풀이
   - 결과
3. 문제 생성 엔진 초안을 구현하라.
   - 각 유형 규칙이 실제로 맞는지 검증 함수 포함
4. 1세션 기준 10문제 풀이 흐름을 만든다.
5. 정답/오답 즉시 판정과 간단 피드백을 넣어라.
6. 결과 화면에서 점수와 오답 다시 풀기 버튼을 제공하라.
7. localStorage 기반으로 유형별 정확도/최근 학습 기록을 저장하라.
8. README.md, TASKS.md, CHANGELOG.md도 함께 생성/업데이트하라.

[UI/UX 요구사항]
- 초3 기준으로 큰 숫자
- 큰 버튼
- 단순한 흐름
- 복잡한 문장 금지
- 자리값이 읽히는 문제 배치
- 가능하면 세로셈 느낌을 살리되, 구현이 복잡하면 MVP 수준으로 단순화 가능
- 아이가 혼자 사용해도 혼란스럽지 않게 하라

[중요한 구현 원칙]
- 문제 생성 규칙이 틀리면 안 된다.
- 유형명이 실제 문제 구조와 반드시 일치해야 한다.
- 처음에는 대표 패턴 1개씩만 정확히 구현해도 된다.
- 유형별 문제를 섞지 말고 분리하라.
- UI는 화려함보다 학습 안정감과 큰 숫자를 우선한다.

[제외 범위]
- 로그인
- 부모 대시보드 고도화
- PDF 출력
- 음성
- AI 해설
- 랭킹/소셜

[산출물 요구]
작업 후 아래를 남겨라.
1. 변경 파일 목록
2. 구현한 화면/기능 요약
3. 문제 생성 규칙 구현 방식 설명
4. Stitch MCP를 UI에 어떻게 반영했는지
5. 아직 미완인 부분
6. 다음 루프 추천 작업
7. 실행/검증 방법

[검증]
가능하면 아래를 수행하라.
- install
- build 또는 lint
- 최소 실행 검증
- 각 유형 샘플 문제가 규칙에 맞는지 스스로 점검

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic MVP first implementation completed" --mode now
```