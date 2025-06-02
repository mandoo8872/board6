**📘 Cursor 전용 개발 사양서 (Board 6 기반)**

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

```tsx
<div class="canvas-container">
  <canvas ref={baseCanvasRef} style={{ zIndex: 1 }} />
  <canvas ref={drawCanvasRef} style={{ zIndex: 2 }} />
</div>
```

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
```

---

## 🔐 약속 (절대 위반 금지)

* 절대 tldraw 사용 금지
* Electron 코드 삽입 금지
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
6. 저장/불러오기, push/pull 로직 추가
7. 객체 선택 → 선택 시 외곽선 색상, 삭제/복제 적용

---

질문하지 말고 위 기준을 100% 지켜 구현하세요.

---

## 🔗 연동 및 데이터 흐름 명세 (2025.05)

### 1. Push/Pull 및 실시간 동기화
- **AdminPage**: useBoardStorage의 pushToFirebase()로 Firebase에 전체 상태 저장(Push)
- **ViewPage**: subscribeToBoardChanges()로 Firebase의 상태를 실시간 구독(동기화)
- **localStorage**: Firebase 미사용/오류 시 pushToStorage(), pullFromStorage()로 동작(백업)

### 2. 저장/불러오기
- useBoardStorage의 saveToFile(), loadFromFile()로 JSON 파일 내보내기/복원
- localStorage 임시 저장/복원 지원

### 3. 환경변수 및 예외 처리
- .env/Vercel 환경변수에 Firebase 설정 필요, 없으면 localStorage만 동작
- 실시간 동기화 실패 시 자동 fallback 및 콘솔/네트워크 로그 확인

### 4. 주요 prop/이벤트 흐름
- CanvasWrapper: onPush, onPull prop으로 연동 이벤트 처리 가능
- ViewPage: isFirebaseAvailable()로 환경 체크 후 subscribeToBoardChanges() 또는 pullFromStorage() 선택
- AdminPage: pushToFirebase(), pushToStorage(), saveToFile() 등 명확히 분리 사용
