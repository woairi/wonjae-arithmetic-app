# Codex Prompt 03 — 전체 유형 랜덤 추가

```text
[작업 유형]
- 기능 추가 / 소규모 확장

[프로젝트]
- 경로: /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app

[먼저 읽을 문서]
1. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/PRD.md
2. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/TASKS.md
3. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/docs/problem-generation-rules.md
4. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/README.md
5. /home/grang/.openclaw/workspace-gongbangjang/wonjae-arithmetic-app/CHANGELOG.md

[요청]
- 기존 5개 유형 외에 `전체 유형 랜덤` 모드를 추가하라.
- 이 모드는 세션 10문제 동안 전체 연습 유형에서 랜덤하게 문제가 나오게 한다.
- 단, 각 문제는 여전히 자신이 속한 실제 유형 규칙을 정확히 만족해야 한다.

[핵심 요구사항]
1. 홈과 유형 선택에서 `전체 유형 랜덤`을 선택할 수 있어야 한다.
2. 랜덤 모드에서는 5개 실제 유형 중에서 문제를 섞어 출제한다.
3. 문제 화면에는 현재 문제의 실제 유형이 보여야 한다.
   - 예: 랜덤 모드 세션 중이더라도 현재 문제가 `받아올림 2번`인지 `받아내림 1번`인지 보이게 한다.
4. 결과 화면에서는
   - 전체 점수
   - 어떤 유형 문제를 틀렸는지
   가 드러나면 좋다.
5. 오답 다시 풀기에서도 각 오답의 실제 유형 정보가 유지되어야 한다.
6. localStorage 기록 구조가 크게 깨지지 않게 반영하라.

[주의]
- 랜덤 모드는 기존 유형 정확성 검증을 약화시키면 안 된다.
- `전체 유형 랜덤`은 새로운 연습 모드이지, 문제 생성 규칙을 느슨하게 만드는 것이 아니다.
- 각 문제는 생성 시점에 자신의 실제 typeId를 유지해야 한다.
- 세션 typeId / 화면 표시 / 저장 구조를 어떻게 표현할지 깔끔하게 정리하라.

[권장 구현 방향]
- 세션용 모드 id와 실제 문제 typeId를 구분하는 방식도 가능하다.
- 예: session type은 `mixed-all`, 각 problem.typeId는 기존 5개 유형 중 하나.
- 결과 화면과 기록 저장에서 혼합 모드 세션을 무리 없이 보여줘라.

[문서 반영]
- README.md
- TASKS.md
- CHANGELOG.md
- 필요하면 docs/RUNLOG.md
를 갱신하라.

[검증]
가능하면 수행하라.
- npm test
- npm run build
- 랜덤 모드에서도 각 문제가 유효한 실제 유형을 갖는지 점검

[산출물 요구]
1. 변경 파일 목록
2. 랜덤 모드 구현 방식 설명
3. 기록/결과 화면에서 실제 유형을 어떻게 보여주는지 설명
4. 남은 리스크
5. 실행/검증 방법

When completely finished, run this command to notify me:
openclaw system event --text "Done: Wonjae arithmetic mixed mode added" --mode now
```