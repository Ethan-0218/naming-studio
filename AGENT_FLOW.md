# Naming Studio AI 에이전트 — 이름 추천 흐름 정리

## 목차
1. [전체 구조 개요](#1-전체-구조-개요)
2. [핵심 개념: 이름 평가 기준](#2-핵심-개념-이름-평가-기준)
3. [단계별 흐름 (10개 노드)](#3-단계별-흐름-10개-노드)
4. [후보 이름 검색 및 채점 방식](#4-후보-이름-검색-및-채점-방식)
5. [선호도 자동 추론](#5-선호도-자동-추론)
6. [세션 및 API 구조](#6-세션-및-api-구조)
7. [파일 구조 요약](#7-파일-구조-요약)

---

## 1. 전체 구조 개요

```
사용자 (모바일 앱)
    │
    ▼
POST /api/chat          ← FastAPI 엔드포인트
    │
    ▼
LangGraph StateGraph    ← 10개 노드로 구성된 상태 머신
    │
    ├── 사주 계산 (domain/saju/)
    ├── 이름 DB 검색 + 채점 (db/ + domain/jakmyeong/)
    └── OpenAI LLM (GPT-4o-mini 기본값)
```

**핵심 기술 스택:**
- **LangGraph**: 10개의 노드(단계)를 순서대로 실행하는 상태 머신
- **LangChain / OpenAI**: 각 단계에서 LLM이 대화 생성 + 구조화된 출력 파싱
- **SQLite**: 사전 채점된 이름 조합 DB (`scored_combinations`), 한자 DB, 등록 이름 코퍼스
- **PostgreSQL** (선택): 세션 상태 영속화

**상태(State):** 모든 노드는 `NamingState`를 공유하며 읽고 씀

```python
# agent/state.py 핵심 필드
NamingState = {
    "messages":           대화 히스토리 (누적)
    "stage":              현재 단계 (예: "preference_interview")
    "user_info":          성(姓), 성별, 생년월일, 생시, 돌림자
    "사주_summary":        일간, 부족한_오행, 신강신약, 용신 등
    "preference_profile": 취향 프로필 (받침 수, 희귀도, 발음 느낌 등)
    "naming_direction":   작명 방향 한 문장 (예: "건강하고 밝은 에너지의 이름")
    "current_candidates": 현재 추천 후보 목록
    "inferred_preferences": 좋아요/싫어요 기반 자동 추론된 취향
    "shown_name_scores":  이미 보여준 이름의 점수 캐시
    "sc_cursor":          scored_combinations DB 페이지네이션 커서
}
```

---

## 2. 핵심 개념: 이름 평가 기준

모든 후보 이름은 6가지 기준으로 점수를 계산해 **0~1 사이의 종합 점수**로 평가됩니다.

| 기준 | 가중치 | 내용 |
|------|--------|------|
| **용신 (用神)** | 40% | 이름이 아이의 부족한 오행을 보충하는가? (사주 기반) |
| **자원오행 (自源五行)** | 18% | 한자 자체의 오행이 인접 글자와 조화(상생)를 이루는가? |
| **수리격 (數理格)** | 15% | 획수 합산 81수리격 — 행운의 획수 조합인가? |
| **발음오행 (發音五行)** | 12% | 초성 발음 오행이 조화롭게 연결되는가? |
| **발음음양 (發音陰陽)** | 8% | 음절의 음/양이 균형 잡혀 있는가? |
| **획수음양 (획수陰陽)** | 7% | 획수 홀짝 패턴이 조화롭게 배열되는가? |

**오행 조화 원리:**
- `상생 (+2)`: 木→火→土→金→水→木 순환 (다음 오행을 생함)
- `동일 (0)`: 같은 오행
- `상극 (-2)`: 서로 극하는 관계

**음양조화 원리 (3글자 이름 기준):**
- `2:1 (음:양 또는 양:음)` → 조화로움 ✓
- `3:0 (전부 같음)` → 부조화

---

## 3. 단계별 흐름 (10개 노드)

```
[welcome] → [info_collection] → [preference_interview] → [direction_briefing]
→ [direction_confirm] → [initial_candidates] → [payment_gate]
→ [preference_update] → [candidate_exploration] ← (루프)
```

---

### Stage 1: Welcome

**파일:** `agent/nodes/welcome_node.py`

- 세션 시작 시 한 번 실행
- LLM이 인사 메시지 생성
- 완료 후 자동으로 `info_collection`으로 전환

---

### Stage 2: Info Collection (정보 수집)

**파일:** `agent/nodes/info_collection_node.py`

**목적:** 이름 추천에 필요한 4가지 필수 정보 수집

| 수집 정보 | 비고 |
|-----------|------|
| 성(姓) + 성 한자 | 예: 김, 金 |
| 성별 | 남/여 |
| 생년월일 | YYYY-MM-DD |
| 생시 | 시간 또는 모름 |

**정보가 모두 모이면:**
→ `calculate_saju_tool` 실행
→ 사주팔자 계산 (일간, 신강신약, **억부용신**, **부족한_오행** 등)
→ `preference_interview`로 자동 전환

> `scored_combinations` 사전 조회 시 **억부용신** 오행(목~수)으로 `yongshin` 행을 매칭한다.  
> `부족한_오행`은 런타임 점수·설명 등에 계속 사용된다.

---

### Stage 3: Preference Interview (취향 인터뷰)

**파일:** `agent/nodes/preference_interview_node.py`

6~7개의 객관식 질문으로 취향 프로필(`preference_profile`)을 구성합니다.

| 순서 | 질문 항목 | 수집 데이터 |
|------|-----------|-------------|
| 1 | 형제자매 이름이 있나요? | `sibling_names` |
| 2 | 형제자매와 돌림자/발음 맞출까요? | `sibling_style_match` |
| 3 | 이름 희귀도 선호는? (독특/보통/평범) | `rarity_preference` |
| 4 | 이름의 느낌은? (단아/밝은/지적/강인/자연/무관) | `name_feel_preference` |
| 5 | 담고 싶은 가치는? (건강/지혜/따뜻함 등) | `values` |
| 6 | 피하고 싶은 것은? (받침 많음/흔함/강한 발음) | `avoid` |

**형제자매 이름이 있고 스타일을 맞추는 경우:**
→ 형제자매 이름에서 `anchor_syllables`와 `anchor_patterns` 추출
→ DB 검색 시 같은 패턴의 이름 우선 탐색

**마지막 질문 처리 후:**
→ LLM이 `naming_direction` 초안 생성 (예: "따뜻하고 지혜로운 느낌의 부드러운 이름")
→ `direction_briefing`으로 전환

---

### Stage 4: Direction Briefing (방향 브리핑)

**파일:** `agent/nodes/direction_briefing_node.py`

- 취향 인터뷰 결과를 바탕으로 작명 방향 요약 제시
- 선택적 단계 (경우에 따라 건너뜀)
- `direction_confirm`으로 전환

---

### Stage 5: Direction Confirm (방향 확인)

**파일:** `agent/nodes/direction_confirm_node.py`

- 파악한 취향과 작명 방향을 부모에게 정리해서 보여줌
- 부모가 **승인(confirmed=true)** 해야 다음 단계로 진행
- 수정 요청 시 → 방향 업데이트 후 다시 제시 (루프)

**LLM 출력 형식 예시:**
```
### 파악한 취향
- 희귀도: 독특한 이름 선호
- 느낌: 밝고 자연스러운
- 오행 보충: 수(水) 기운이 필요한 사주

**작명 방향:** 맑고 자연스러운 수(水) 기운의 이름
```

---

### Stage 6: Initial Candidates (초기 후보 추천)

**파일:** `agent/nodes/initial_candidates_node.py`

**흐름:**
1. `find_name_candidates()` 도구로 DB에서 후보 최대 8개 검색
2. LLM이 그 중 최대 3개 선별 + 추천 이유 생성
3. NAME 블록으로 출력 (상세 정보 포함)
4. `payment_gate`로 전환

**NAME 블록 예시:**
```json
{
  "type": "NAME",
  "data": {
    "한글": "준서",
    "full_name": "김준서",
    "syllables": [
      {"한글": "준", "한자": "俊", "meaning": "뛰어날", "오행": "금"},
      {"한글": "서", "한자": "瑞", "meaning": "상서로울", "오행": "금"}
    ],
    "발음오행_조화": "대길",
    "rarity_signal": "보통",
    "score_breakdown": {"용신": 0.85, "자원오행": 0.72, "수리격": 0.90, ...},
    "reason": "수(水) 기운의 사주를 보완하는 금(金) 한자 조합..."
  }
}
```

---

### Stage 7: Payment Gate (결제 게이트)

**파일:** `agent/nodes/payment_gate_node.py`

- 결제 전까지 대기
- 모바일 앱에서 `action: "payment_complete"` 전송 시 → `candidate_exploration`으로 전환

---

### Stage 8: Preference Update (취향 업데이트)

**파일:** `agent/nodes/preference_update_node.py`

- `candidate_exploration` 직전에 실행 (매 턴)
- 사용자 메시지에서 취향 변경 감지:
  - 받침 수 변경 ("받침 없는 이름으로")
  - 희귀도 변경 ("좀 더 흔한 이름으로")
  - 발음 느낌 변경 ("부드러운 느낌으로")
  - 작명 방향 변경
- 방향이 바뀌면 `sc_cursor=0` 리셋 (처음부터 다시 탐색)

---

### Stage 9: Candidate Exploration (후보 탐색 — 루프)

**파일:** `agent/nodes/candidate_exploration_node.py`

결제 후 부모가 만족할 때까지 반복되는 핵심 루프입니다.

**매 턴 실행 순서:**

```
Phase 1: 도구 루프 (최대 4회)
  → get_name_candidates() 호출 (1회당 12개 반환)
  → 누적된 후보 풀 구성

Phase 2: LLM 선별
  → 누적 후보 중 최적 3개 선택
  → 각각 추천 이유 생성 (score_breakdown 패턴 반영)
```

**LLM에게 제공되는 컨텍스트:**
- 좋아요/싫어요 이름 목록 + 각각의 점수 상세
- section 3 취향 (느낌, 가치, 회피)
- 형제자매 이름 (있는 경우)
- 현재 `naming_direction`
- 자동 추론된 `inferred_preferences`

**좋아요/싫어요 액션 처리:**

```
사용자가 like/dislike 전송
    → api/routes.py에서 name_store 업데이트
    → preference_inferrer.infer_preferences() 실행
    → inferred_preferences 자동 업데이트
    → 다음 get_name_candidates() 호출 시 필터 반영
```

---

## 4. 후보 이름 검색 및 채점 방식

**파일:** `agent/tools/find_name_candidates_tool.py`

### 검색 경로 1: scored_combinations DB (우선)

성 한자(`surname_hanja`)와 **억부용신**(목~수)이 모두 있는 경우 사전 채점 DB에서 `yongshin` 행만 조회:

```
get_top_names(
    surname_hanja,
    required_ohaengs: [억부용신],
    … 필터(max_받침, 앵커 패턴, 희귀도 하한 등)
)
```

### 검색 경로 2: registered_names + 런타임 채점 (폴백)

성 한자 또는 억부용신이 없는 경우:
1. 등록 이름 코퍼스에서 조건 필터링
2. 한자 조합 런타임 생성
3. 성 한자·억부용신이 있으면 `get_best_combination(required_ohaengs=[억부용신])`로 사전 점수 재활용

### 후처리 필터

검색 결과에 다음 필터 추가 적용:

| 필터 | 설명 |
|------|------|
| 이미 보여준 이름 제외 | `shown_name_scores` 기준 |
| 좋아요/싫어요 이름 제외 | `name_store` 기준 |
| 형제자매 이름 제외 | `sibling_names` 기준 |
| 첫 음절 다양성 | 동일 첫 음절 최대 2개 (top 12 기준) |
| 발음 느낌 페널티 | 선호 느낌과 다르면 점수 × 0.7 |

### 종합 점수 공식

```
composite_score =
    용신       × 0.40  +
    자원오행   × 0.18  +
    수리격     × 0.15  +
    발음오행   × 0.12  +
    발음음양   × 0.08  +
    획수음양   × 0.07  +
    희귀도_보정 × 0.001 +  (동점 처리용)
    형제자매_패널티         (해당 시 감점)
```

---

## 5. 선호도 자동 추론

**파일:** `agent/preference_inferrer.py`

부모가 좋아요/싫어요를 누를 때마다 자동으로 취향 패턴을 분석합니다.

| 추론 항목 | 분석 방식 |
|-----------|-----------|
| **name_feel_preference** | 좋아요 이름들의 초성 분석 — 부드러운(ㅅㄴㅁㅇㅎㄹ) vs 강한(ㅂㄱㄷㅈㅊ) 비율 |
| **max_받침_count** | 좋아요 이름들의 평균 받침 수 |
| **rarity_preference** | 좋아요 이름들의 rarity_signal 분포 비교 |

추론된 결과는 `inferred_preferences`에 저장되어 다음 `get_name_candidates()` 호출 시 필터로 반영됩니다.

---

## 6. 세션 및 API 구조

### API 엔드포인트

**`POST /api/chat`** — 메인 대화 엔드포인트

```
Request: { session_id, message, action }
Response: { stage, content, liked_names, disliked_names, payment_required, naming_direction }
```

**Action 종류:**

| action | 설명 |
|--------|------|
| (없음) | 일반 대화 메시지 |
| `submit_info` | 기본 정보 폼 제출 |
| `update_dolrimja` | 돌림자 업데이트 |
| `like:이름` | 이름 좋아요 |
| `dislike:이름` | 이름 싫어요 |
| `unlike:이름` | 좋아요 취소 |
| `undislike:이름` | 싫어요 취소 |
| `payment_complete` | 결제 완료 → 탐색 단계 진입 |

**`POST /api/chat/stream`** — SSE 스트리밍 버전 (도구 호출 중 진행 상황 실시간 전달)

**`GET /session/{session_id}`** — 세션 상태 복구 (LLM 호출 없음)

### 세션 저장 방식

| 환경 | 방식 |
|------|------|
| 개발 | `MemorySaver` (프로세스 인메모리) |
| 운영 | `PostgresSaver` (LangGraph 체크포인터) |

PostgreSQL 사용 시:
- `naming_sessions` 테이블: 단계, 결제 상태, 작명 방향, 사용자 정보
- `session_messages` 테이블: 역할, 콘텐츠 블록, 단계
- 30일 이상 된 세션 자동 정리

---

## 7. 파일 구조 요약

```
backend/
├── main.py                          # FastAPI 앱 진입점, DB/그래프 초기화
├── api/routes.py                    # REST 엔드포인트, 액션 처리
│
├── agent/
│   ├── graph.py                     # LangGraph StateGraph 정의 (10개 노드 연결)
│   ├── state.py                     # NamingState TypedDict
│   ├── schemas.py                   # LLM 출력 스키마 (Pydantic)
│   ├── persona.py                   # AI 페르소나 상수
│   ├── preference_inferrer.py       # 좋아요/싫어요 기반 취향 자동 추론
│   │
│   ├── nodes/                       # 10개 단계 노드
│   │   ├── welcome_node.py
│   │   ├── info_collection_node.py
│   │   ├── preference_interview_node.py
│   │   ├── direction_briefing_node.py
│   │   ├── direction_confirm_node.py
│   │   ├── initial_candidates_node.py
│   │   ├── payment_gate_node.py
│   │   ├── preference_update_node.py
│   │   └── candidate_exploration_node.py
│   │
│   ├── tools/
│   │   ├── find_name_candidates_tool.py   # DB 검색 + 채점
│   │   └── calculate_saju_tool.py         # 사주팔자 계산
│   │
│   └── prompts/                     # 단계별 동적 시스템 프롬프트
│
├── domain/                          # 한국 작명 이론 구현
│   ├── saju/                        # 사주팔자 (오행, 십간, 십이지 등)
│   ├── jakmyeong/                   # 음양조화, 오행조화, 발음오행
│   └── numerology/                  # 81수리격
│
└── db/                              # 데이터 접근 레이어 (Repository 패턴)
    ├── hanja_repository.py
    ├── registered_name_repository.py
    └── scored_combinations_repository.py
```

---

## 대화 흐름 예시 (처음부터 끝까지)

```
1. 부모 앱 실행 → POST /api/chat (세션 시작)
2. [welcome] LLM 인사
3. [info_collection] LLM이 성, 성별, 생년월일, 생시 순서로 수집 (멀티턴)
4. ← 4가지 정보 완성 → 사주 계산 → 부족한_오행 파악
5. [preference_interview] 6가지 취향 질문 (CHOICE_GROUP 형식)
6. ← 모든 질문 완료 → naming_direction 초안 생성
7. [direction_briefing] 방향 요약 제시
8. [direction_confirm] 부모 승인 대기 (수정 요청 시 루프)
9. ← confirmed=true →
10. [initial_candidates] DB 검색 → LLM이 3개 선별 → NAME 블록 출력
11. [payment_gate] 결제 대기
12. ← payment_complete 액션 →
13. [preference_update] 사용자 메시지에서 취향 변경 감지
14. [candidate_exploration] LLM 도구 루프 → 3개 추천 (무한 반복)
    - 부모가 좋아요/싫어요 → preference_inferrer 실행 → 필터 자동 조정
    - 부모가 방향 변경 요청 → preference_update에서 반영 → 새 탐색
    - 마음에 드는 이름 찾을 때까지 반복
```
