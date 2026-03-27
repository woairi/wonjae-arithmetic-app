# 원재 연산앱 UI/UX 사양서 (Stitch용)

## 1. 목적
이 문서는 Stitch MCP에서 원재 연산앱의 핵심 화면 구조를 먼저 설계할 때 참고하는 사양서다.

핵심 목표는 아래 3가지다.
1. 아이가 연산 유형을 헷갈리지 않고 고를 수 있어야 한다.
2. 문제 풀이 화면에서 숫자와 자리값 구조가 분명해야 한다.
3. 결과와 오답 복습 흐름이 짧고 단순해야 한다.

---

## 2. 제품 한 줄 정의
초등학교 3학년 아동이 3자리 덧셈/뺄셈의 자리올림·자리내림 유형을 구분해서 반복 연습하는 모바일 학습 앱.

키워드:
- mobile-first
- kid-friendly
- large numbers
- simple learning flow
- focused repetition
- calm study app

---

## 3. 디자인 방향
### 톤 앤 매너
- 차분하고 명확함
- 너무 유치하지 않음
- 숫자가 잘 보임
- 아이가 혼자 써도 부담 없음
- 부모가 같이 봐도 이해 쉬움

### 피해야 할 방향
- 게임 요소 과다
- 과한 애니메이션
- 텍스트 과다
- 작은 버튼/작은 숫자
- 복잡한 대시보드

---

## 4. 핵심 화면 목록
### 우선순위 1
1. 홈
2. 유형 선택
3. 문제 풀이
4. 결과

### 우선순위 2
5. 오답 복습
6. 보호자용 간단 요약

---

## 5. 화면별 요구사항

## Screen 1. 홈
### 목적
아이와 보호자가 오늘 무엇을 연습할지 바로 결정하게 한다.

### 필수 요소
- 오늘 연습 시작 버튼
- 추천 유형 카드
- 최근 약한 유형 카드
- 최근 성취 요약
- 큰 CTA 버튼

### UX 메모
- 홈은 복잡한 정보보다 “무엇을 할지 선택”에 집중
- 텍스트보다 버튼과 카드가 먼저 보여야 함

---

## Screen 2. 유형 선택
### 목적
자리올림/자리내림 유형을 분명히 구분하게 한다.

### 필수 요소
- 덧셈 / 뺄셈 구분
- 유형 카드
  - 3자리 덧셈
  - 받아올림 2번
  - 받아올림 3번
  - 받아내림 1번
  - 받아내림 2번
- 각 카드의 짧은 설명
- 시작 버튼

### UX 메모
- 카드 이름이 길어도 읽기 쉬워야 함
- 유형끼리 헷갈리지 않도록 시각 구분 필요

---

## Screen 3. 문제 풀이
### 목적
아이가 연산 문제를 보고 답을 입력한다.

### 필수 요소
- 현재 유형 표시
- 문제 번호 (예: 3 / 10)
- 큰 숫자 표시
- 세로셈 느낌의 문제 배치 또는 자리값이 드러나는 구조
- 답 입력 칸
- 제출 버튼
- 짧은 피드백

### UX 메모
- 이 화면이 가장 중요함
- 숫자가 크고 또렷해야 함
- 버튼도 커야 함
- 불필요한 설명 금지
- 아이가 자리값을 눈으로 따라갈 수 있어야 함

---

## Screen 4. 결과
### 목적
얼마나 맞았는지 보고, 다시 연습할 수 있게 한다.

### 필수 요소
- 맞은 개수
- 틀린 개수
- 이번 유형 정확도
- 오답만 다시 풀기 버튼
- 같은 유형 다시 하기 버튼
- 다른 유형 선택 버튼

### UX 메모
- 긴 분석보다 다음 행동 버튼이 분명해야 함
- 칭찬 문구는 짧고 명확하게

---

## 6. 시각 디자인 가이드
### 숫자
- 가장 중요
- 크고 진하게
- 자리 구분이 쉬워야 함

### 버튼
- 크고 단순
- 한 화면에서 CTA 1~2개만 강조

### 컬러
- 차분한 블루 / 그린 계열
- 정답은 안정적인 초록
- 오답은 과한 빨강 말고 부드러운 코랄

### 카드
- 둥근 모서리
- 넉넉한 여백
- 정보는 적게

---

## 7. Stitch 생성 우선순위
1. 홈
2. 유형 선택
3. 문제 풀이
4. 결과

---

## 8. Stitch용 프롬프트 예시
Design a mobile-first arithmetic learning app for a 3rd grade elementary student. The app helps the child practice specific addition and subtraction patterns separately: 3-digit addition, addition with 2 carries, addition with 3 carries, subtraction with 1 borrow, and subtraction with 2 borrows. Prioritize big numbers, clear type selection, a simple problem-solving screen, and a short result/retry flow. Make it calm, clean, easy to use, and not overly game-like.
