**📘 Cursor 전용 개발 사양서 (Board 6 v1.1 기준)**

---

## 🎯 목적

Cursor에게 전체 구현 흐름을 "추론 없이" 정확히 따라오게 하기 위한 고정 명세서. 추론 금지, 조건 기반 구현 강조.

---

## 🧱 캔버스 구조

* **해상도:** 2160 x 3840 고정, 브라우저 뷰포트에 맞춰 `transform: scale(...)`
* **레이어 구성:**

  * `<canvas id="baseCanvas">` → shape, grid, selectedId 표시 (`zIndex: 1`)
  * `<canvas id="drawCanvas">` → stroke, 지우개 (`zIndex: 2`, 항상 상단)
  * **Interaction은 drawCanvas에서만 발생함**

* **그리드(Grid):**

  * 캔버스에는 항상 표시되며 사용자 설정 없이 기본적으로 활성화됨
  * `baseCanvas`에서 shape와 함께 렌더링되며, 객체 배치 시 시각적 기준선 제공
  * **최초 페이지 로드시 그리드 표시가 꺼진 상태(off)가 기본값임**

```tsx
<div class="canvas-container">
  <canvas ref={baseCanvasRef} style={{ zIndex: 1 }} />
  <canvas ref={drawCanvasRef} style={{ zIndex: 2 }} />
</div>
```

---

## 🎛 플로팅 툴바

### 🎨 기본 속성

* **위치 및 크기:**
  * 기본 위치: 좌상단 (x: 50, y: 50)
  * 기본 크기: 600 x 80px
  * 기본 투명도: 50%

* **드래그 영역:**
  * 상단 20px 영역에서만 드래그 가능
  * 캔버스 영역 내로 위치 제한
  * 최소 크기: 200 x 100px

* **상태 저장:**
  * localStorage에 위치, 크기, 투명도 저장
  * 페이지 로드 시 복원

### 🛠️ 도구 구성

* **기본 도구:**
  * 선택 (👆)
  * 펜 (✏️)
  * 지우개 (🧽)

* **설정 도구:**
  * 색상 선택기
  * 크기 조절 바 (1-20)
  * 투명도 조절 바 (10-100%)

### 🎯 도구 전환 정책

* **기본 도구:**
  * 진입 시 기본 도구는 `select`
  * `pen/eraser` 사용 시 2000ms 동안 입력 없으면 자동 `select`로 복귀
  * 도구 전환 시 타이머 리셋

* **도구별 동작:**
  * 선택: 객체 선택/이동/크기조절
  * 펜: 자유 그리기
  * 지우개: stroke 삭제

* **설정 도구:**
  * 색상: 현재 선택된 도구의 색상 변경
  * 크기: 펜/지우개 크기 조절
  * 투명도: 툴바 전체 투명도 조절

---

## 🎛 도구 및 입력 흐름

### 🔧 도구 구분

* `DrawingTool = 'pen' | 'eraser' | 'select' | 'rect'`
* `CommandTool = 'text' | 'image' | 'undo' | 'redo' | 'grid' | 'settings'`
* `ToolbarTool = DrawingTool | CommandTool`

### 🧭 도구 전환 정책

* 진입 시 기본 도구는 `select`
* `pen/eraser` 사용 시 2000ms 동안 입력 없으면 자동 `select`로 복귀
* 도구 전환 시 타이머 리셋

### 📌 도구 트리거 및 처리

| 도구     | 트리거          | 처리 위치      | 종료 조건          |
| ------ | ------------ | ---------- | -------------- |
| pen    | pointerDown  | drawCanvas | pointerUp 후 2초 |
| eraser | pointerMove  | drawCanvas | pointerUp      |
| select | pointerClick | baseCanvas | escape / 전환    |
| rect   | pointerClick | baseCanvas | 다음 클릭/전환       |
| text   | pointerClick | baseCanvas | 사이드 패널 편집     |

### 📝 텍스트 박스 처리

* **생성 트리거:**
  * 도구 선택 후 클릭
  * Ctrl+V (클립보드 텍스트 존재 시)

* **편집 제한:**
  * 사이드 패널 전용 편집
  * 인라인 편집 불가
  * Delete/Backspace 키 비활성화

* **속성 패널:**
  * 텍스트 내용 입력
  * 배경색 선택
  * 투명도 조절
  * 정렬 옵션 (수직/수평)

---

## 🧩 상태 및 prop 정의 (고정)

```ts
interface CanvasWrapperProps {
  tool: DrawingTool
  shapes: Shape[]
  strokes: Stroke[]
  penColor: string
  penSize: number
  gridSize: number
  selectedId: string | null
  setShapes: (fn: (prev: Shape[]) => Shape[]) => void
  setStrokes: (fn: (prev: Stroke[]) => Stroke[]) => void
  setSelectedId: (id: string | null) => void
  onPush?: () => void
  onPull?: () => void
}

interface ToolbarState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
}
```

---

## 🔐 약속 (절대 위반 금지)

* 절대 tldraw 사용 금지
* DOM 직접 접근 금지 (`getElementById`, `document.querySelector` 등 X)
* drawCanvas와 baseCanvas 외에 `<canvas>` 사용 금지
* drawCanvas는 stroke 전용, baseCanvas는 shape 전용

---

## 📎 예외 방지 주의사항

* useEffect에 `selectedId`, `penColor`, `gridSize` 누락되지 않게 설정
* setShapes, setStrokes는 항상 prev 사용 방식으로 작성
* canvas clear는 전체 redraw 전에 먼저 실행

---

## ✅ 구현 순서 권장

1. CanvasWrapper.tsx에 두 canvas 분리 후 배치
2. 각 useEffect로 shape, stroke 나눠서 렌더링
3. Toolbar → onToolChange, onCommand 분리 전달
4. InteractionLayer → pointer 이벤트 분기 작성
5. 필기/지우개 타이머 처리 로직 작성
6. 실시간 동기화 구현
7. 객체 선택 → 선택 시 외곽선 색상, 삭제/복제 적용

---

질문하지 말고 위 기준을 100% 지켜 구현하세요.

---

## 🔗 연동 및 데이터 흐름 명세 (v1.1)

### 1. 실시간 동기화
- **AdminPage**: useBoardStorage의 pushToStorage()로 전체 상태 저장
- **ViewPage**: pullFromStorage()로 실시간 구독
- **localStorage**: 오프라인 시 fallback 용도로 사용
- **동기화 최적화**: debounce/throttle을 통한 이벤트 제어

### 2. 저장/불러오기
- useBoardStorage의 saveToFile(), loadFromFile()로 JSON 파일 내보내기/복원
- localStorage 임시 저장/복원 지원
- 동기화 콜백을 통한 상태 업데이트 처리

### 3. 환경변수 및 예외 처리
- 실시간 동기화 실패 시 자동 fallback 및 콘솔/네트워크 로그 확인
- 동기화 실패 시 자동 재시도 및 에러 처리

### 4. 주요 prop/이벤트 흐름
- CanvasWrapper: onPush, onPull prop으로 연동 이벤트 처리
- ViewPage: pullFromStorage()로 실시간 구독
- AdminPage: pushToStorage(), saveToFile() 등 명확히 분리 사용
- 동기화 유틸리티: debounceThrottle.ts와 syncUtils.ts를 통한 이벤트 최적화 및 동기화 처리
