**📘 Board 6 공유보드 통합 기획서 (v1.0 - 2024.06.04 기준)**

---

## 🧭 1. 서비스 개요

* **목적:**

  * 사무실 관리자와 현장 키오스크 간의 정보 공유를 위한 캔버스 기반 공유보드 구축
  * Firebase Realtime Database를 통한 실시간 동기화 구현
  * Vercel 기반 웹앱으로 배포

* **사용자 시나리오:**

  * **관리자(AdminPage):** 객체 생성/배치/편집, Firebase Push/Pull, JSON 저장/불러오기
  * **현장 사용자(ViewPage):** 필기/지우개 도구 사용, 도구 제한 UI, 실시간 동기화

---

## 🏗️ 2. 시스템 아키텍처

* **Front:** React + TypeScript + Vite
* **Canvas Layer 분리:**

  * `baseCanvas`: shape, grid, 선택 상태 등 (zIndex 1)
  * `drawCanvas`: stroke, 지우기 등 (zIndex 2)
* **Canvas 렌더 구조:**

  * 두 레이어는 DOM에서 병렬로 존재하며 각각 독립적으로 useEffect로 렌더링

```tsx
<canvas ref={baseCanvasRef} style={{ zIndex: 1 }} />
<canvas ref={drawCanvasRef} style={{ zIndex: 2 }} />
```

* **저장 구조:** Firebase Realtime Database + localStorage + JSON 내보내기/불러오기

* **해상도 정책:** 고정 해상도 2160 × 3840(px) 세로형 캔버스 기준으로 렌더링하며, ViewCam 개념은 사용하지 않음

* **동적 스케일링:** 고정 해상도의 캔버스를 브라우저 창 내에서 전체가 보이도록 `scale`로 조정. 캔버스는 중앙 정렬되며 `transform: scale(...)` 방식 사용

* **캔버스 프레임 속성:**

  * `position: absolute`, `top: 0`, `left: 0`, `zIndex`를 활용한 시각 우선순위 지정
  * `pointerEvents`: 도구 상태에 따라 interaction canvas와 view-only canvas 전환 조정

* **전체 레이아웃 구성:**

  * 좌상단: 도구모음 Toolbar (아이콘 + 텍스트)
  * 중앙: 캔버스 영역 (세로 4K 고정, 스케일 렌더링)
  * 우상단: 객체 속성 및 권한 설정 패널

---

## 🧱 3. 시스템 기능 기획

### 3.x 저장 및 동기화 방식

* **Firebase Realtime Database:**

  * 실시간 동기화를 위한 메인 저장소
  * boards/mainBoard에 전체 상태 저장
  * 환경변수로 설정 관리

* **Save / Load (저장 및 불러오기):**

  * 객체 및 stroke 전체 상태 + 메타 정보를 JSON으로 저장
  * localStorage에 임시 보관 가능

* **Push / Pull (전송 및 수신):**

  * ViewPage <-> AdminPage 간 Firebase를 통한 실시간 동기화
  * Push: 관리자 → 현장에 보드 상태 보내기
  * Pull: 관리자 ← 현장의 현재 보드 상태 불러오기

### 3.0 그리드 및 스냅

* **그리드(Grid):**

  * 캔버스에는 항상 표시되며 사용자 설정 없이 기본적으로 활성화됨
  * `baseCanvas`에서 shape와 함께 렌더링되며, 객체 배치 시 시각적 기준선 제공
  * **최초 페이지 로드시 그리드 표시가 꺼진 상태(off)가 기본값임**

* **그리드 스냅(Grid Snap):**

  * 객체 이동 시 항상 적용되며, 사용자가 위치를 조정하면 그리드에 맞춰 자동 정렬됨
  * 객체 생성/이동/크기 조절 시 좌표는 가장 가까운 그리드 단위로 정규화됨

### 3.1 도구 및 입력 정책

* **도구 목록:**

  * `pen`, `eraser`, `select`, `rect`, `text`, `image`, `undo`, `redo`, `grid`, `settings`

* **핵심 도구 처리 방식:**

  * `onToolChange`: pen, eraser, select, rect (canvas와 직접 상호작용)
  * `onCommand`: text, image, undo 등 삽입/명령 도구

* **입력 자동 전환 정책:**

  * pen/eraser는 2000ms 이상 입력 없을 시 `select`로 자동 복귀
  * 입력 도중에는 타이머 리셋
  * 도구 전환 시 이전 타이머 초기화

* **도구별 세부 동작 및 트리거 조건:**

  | 도구         | 트리거           | 작동 내용                               | 종료 조건                                  |
  | ---------- | ------------- | ----------------------------------- | -------------------------------------- |
  | pen        | pointer down  | stroke 배열에 점 추가, drawCanvas에 실시간 렌더 | pointer up 이후 자동 저장 대기, 2초 후 select 전환 |
  | eraser     | pointer move  | isErasable stroke 판별 후 삭제 표시        | pointer up 시 실제 삭제 및 redraw            |
  | select     | pointer click | shape hitTest 결과에 따라 선택 상태 변경       | escape 또는 다른 도구 전환                     |
  | rect       | pointer click | 클릭 지점에 사각형 생성, 선택됨                  | 도구 전환 또는 다른 객체 클릭 시 종료                 |
  | text/image | onCommand 호출  | 지정된 위치에 객체 생성                       | 삽입 즉시 select 전환                        |

### 3.2 객체 정책

* **기본 객체 유형:** rect, text, image (stroke는 독립 처리)
* **객체 메타 속성:**

  * `isMovable`, `isDeletable`, `isResizable`, `isErasable`
* **기능 요구:**

  * 객체 선택/hover 시 외곽선 강조
  * Del/Backspace로 삭제 (stroke 제외)
  * Ctrl+D 또는 Ctrl+C/V로 복제
  * 선택 상태 escape로 해제 가능

### 3.3 텍스트 박스 객체

* **생성 방식:**
  * 툴바의 텍스트 박스 도구 선택 후 캔버스 클릭
  * Ctrl+V로 클립보드 텍스트 붙여넣기 시 자동 생성
  * 초기 속성: 회색 배경(#888888), 50% 투명도, 150x60 크기

* **편집 정책:**
  * 인라인 편집 불가, 사이드 패널에서만 편집 가능
  * 텍스트 내용, 배경색, 투명도, 정렬 설정 가능
  * 텍스트 편집 중 Delete/Backspace 키 비활성화

* **정렬 옵션:**
  * 수직: 위, 가운데, 아래
  * 수평: 왼쪽, 가운데, 오른쪽
  * 워드 스타일 아이콘으로 직관적 UI 제공

* **동기화:**
  * 다른 객체들과 동일한 저장/복원 구조 사용
  * UUID 기반 객체 식별
  * 드래그/이동/크기조절 지원

---

## 🧩 4. 기능 상세 프로세스

### 4.1 캔버스 렌더링 흐름

* **drawCanvas useEffect:** stroke 상태 변화에 따라 redraw
* **baseCanvas useEffect:** shape, grid, selectedId 등에 따라 redraw

### 4.2 입력 이벤트

* `handlePointerDown/Move/Up`: drawCanvas에서 stroke 입력 처리
* 선택/객체 생성은 baseCanvas 상단에서 동작
* drawCanvas는 항상 위에 떠 있으므로 겹침 없음

### 4.3 선택 도구

* 기본 도구이며 첫 진입 시 자동 설정
* 선택된 객체의 외곽선 색상은 파란색
* 선택된 객체만 삭제/편집 가능

---

## 🧩 5. 개발 관리 및 안정성 정책

* **컴포넌트 분리 계획:**

  * `CanvasWrapper`: 전체 보드 컨테이너
  * `BaseLayer`: shape/grid/states 렌더링 담당
  * `DrawLayer`: stroke 입력 및 지우개 담당
  * `InteractionLayer`: pointer 이벤트 핸들링 및 도구 상태 전환/선택 처리 담당

* **상태 업데이트 정책:**

  * `setShapes(prev => [...prev, newShape])` 형식 고정
  * useEffect 의존성 배열 정밀 구성 (`selectedId` 등 누락 방지)

* **문제 추적 개선:**

  * 캔버스가 안 보일 경우, JSX에 `<canvas>`가 포함되어 있는지 무조건 확인

---

## 🔐 6. 개발 정책 및 제한 사항

* **Firebase 연동:**

  * Firebase Realtime Database를 통한 실시간 동기화 구현
  * 환경변수로 설정 관리
  * 연결 실패 시 localStorage fallback

* **배포 정책:**

  * Vercel 웹앱 기반으로 개발 및 배포
  * 빌드 스크립트 최적화 및 권한 문제 해결

* **기술 제한 사항:**

  * **tldraw 절대 사용 금지**
  * 모든 캔버스 기능은 HTML5 Canvas API 기반으로 직접 구현함
  * 목적은 의존도 없이 순수한 커스텀 렌더링 구조 확보

---

## 🔥 7. 보드 연동 및 실시간 동기화 정책 (v1.0)

### 7.1 연동 구조 개요
- **관리자(AdminPage)**: 보드 상태를 직접 편집하고, Firebase Realtime Database에 전체 상태를 저장
- **현장(ViewPage)**: Firebase의 보드 상태를 실시간 구독하여, 관리자가 push한 최신 상태를 즉시 반영
- **localStorage**: Firebase 연결 실패/오프라인 시 fallback 용도로 사용

### 7.2 주요 연동 흐름
- **Push (Admin → View)**: AdminPage에서 pushToFirebase() 호출 → Firebase에 전체 상태 저장 → ViewPage에서 subscribeToBoardChanges()로 실시간 반영
- **Pull (View → Admin)**: 필요 시 ViewPage의 상태를 pullFromStorage()로 불러와 AdminPage에서 복원 가능
- **저장/불러오기**: useBoardStorage 훅을 통해 JSON 파일로 내보내기/불러오기, localStorage 임시 저장 지원

### 7.3 환경변수 및 예외 처리
- .env 및 Vercel 환경변수에 Firebase 설정 필요
- Firebase 연결 실패 시 자동으로 localStorage fallback
- 실시간 동기화가 안 될 경우, 콘솔/네트워크 로그 및 환경변수, Firebase 규칙, 배포 상태 점검

### 7.4 실제 코드 흐름 예시
- AdminPage: useBoardStorage의 pushToFirebase(), pushToStorage(), saveToFile() 등 사용
- ViewPage: subscribeToBoardChanges()로 실시간 구독, isFirebaseAvailable()로 환경 체크 후 localStorage fallback

### 7.5 데이터 구조
- Firebase boards/mainBoard에 전체 상태(JSON) 저장: shapes, strokes, selectedId, timestamp 등 포함

### 7.6 동기화 최적화
- **Debounce/Throttle 적용:**
  * `debounce`: 연속된 이벤트를 그룹화하여 마지막 이벤트만 처리 (예: 스트로크 저장)
  * `throttle`: 일정 시간 간격으로 이벤트 처리 제한 (예: 실시간 동기화)
  * `debounceThrottle.ts`에서 유틸리티 함수 제공

- **동기화 유틸리티:**
  * `syncUtils.ts`에서 동기화 관련 핵심 기능 제공
  * `createSyncCallbacks`: 동기화 콜백 함수 생성
  * `syncToFirebase`: Firebase 데이터 업데이트
  * `syncStrokesToFirebase`: 스트로크 데이터 동기화
  * `mergeLWW`: Last Write Wins 병합 전략 구현

- **동기화 전략:**
  * LWW(Last Write Wins) 병합 전략으로 충돌 해결
  * 타임스탬프 기반 업데이트 순서 결정
  * 삭제된 객체(tombstone) 처리 포함

---

## ✅ 정리

Board 6 v1.0은 Firebase Realtime Database를 통한 실시간 동기화를 구현하고, 각 도구/레이어/상태를 명확히 분리하여 안정성을 확보했습니다. 다음 단계로는 컴포넌트 분리와 도구별 전용 처리 모듈 도입이 권장됩니다.
