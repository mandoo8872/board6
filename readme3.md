**📁 Board 6 전용 파일구조 설계 및 Cursor용 명세 (2025.05.28 기준)**

---

## 📦 1. 디렉토리 구조 (기본)

```bash
src/
├── components/
│   ├── CanvasWrapper.tsx        # 전체 캔버스와 도구 상태 통합 컨테이너
│   ├── DrawLayer.tsx            # drawCanvas 전용: 필기, 지우개
│   ├── BaseLayer.tsx            # baseCanvas 전용: 객체, 그리드
│   ├── Toolbar.tsx              # 도구 선택 UI
│   ├── PropertiesPanel.tsx      # 우상단 객체 속성 제어 패널
│   └── InteractionLayer.tsx     # pointer 이벤트 핸들링, 도구 전환, 선택 등
├── hooks/
│   ├── useStroke.ts             # stroke 관리 훅 (add/remove 등)
│   └── useShapes.ts             # shape 선택, 이동, 삭제 등
├── types/
│   └── index.ts                 # Stroke, Shape, Tool 등 공통 타입 정의
├── utils/
│   ├── canvasHelpers.ts         # drawStroke, drawGrid 등 공통 캔버스 렌더 함수
│   └── constants.ts             # 해상도, 기본 설정 등
├── App.tsx                      # 라우팅 및 진입점
└── index.tsx                    # React DOM 렌더링
```

---

## 🧱 2. 각 컴포넌트 책임 명세 (Cursor 참고용)

### 🧩 CanvasWrapper.tsx

* props: `tool`, `shapes`, `strokes`, `selectedId`, `penColor`, `penSize`, `gridSize`, `setShapes`, `setStrokes`, `setSelectedId`, `onPush`, `onPull`
* 역할:

  * drawCanvas/baseCanvas DOM 구조 포함
  * 레이어 상태 조정 및 리렌더링 useEffect 분리
  * InteractionLayer 포함 (포인터 이벤트 전달)

### ✏️ DrawLayer.tsx

* drawCanvas 렌더링: stroke 입력, eraser 작동
* pointerDown/Move/Up 처리
* pen/eraser 외에는 렌더 제외

### 📐 BaseLayer.tsx

* baseCanvas 렌더링: grid + shape + selected 상태
* select, rect 도구에만 렌더링 관련 처리

### 🛠 Toolbar.tsx

* 도구 버튼 UI
* `onToolChange(tool: DrawingTool)` 전달
* `onCommand(command: CommandTool)` 분리 처리 (text/image/undo 등)

### 🧾 PropertiesPanel.tsx

* 선택된 객체의 `meta` 설정 UI (`isMovable`, `isDeletable`, `isResizable`, `isErasable` 등)
* 위치: 우상단 고정, 선택된 객체 있을 때만 렌더링

### 🕹 InteractionLayer.tsx

* 모든 pointer 이벤트 처리
* 도구에 따라 이벤트 라우팅

  * pen/eraser → DrawLayer 핸들러 호출
  * select/rect → BaseLayer hitTest 및 생성/선택 처리
* 자동 도구 복귀 타이머 포함 (2초)

---

## 📂 3. Hooks & Types

### `useStroke.ts`

* stroke 추가, 삭제, 복원 관리
* 필기 타이머 내부 포함 가능

### `useShapes.ts`

* shape 선택, 이동, 삭제, 복제
* meta 기반 기능 제한 처리 포함 (e.g. isMovable)

### `types/index.ts`

```ts
export type Tool = 'pen' | 'eraser' | 'select' | 'rect'
export type CommandTool = 'text' | 'image' | 'undo' | 'redo' | 'grid' | 'settings'

export interface Point { x: number; y: number }
export interface Stroke {
  id: string
  points: Point[]
  color: string
  size: number
  isErasable?: boolean
}
export interface Shape {
  id: string
  type: 'rect' | 'text' | 'image'
  x: number
  y: number
  width?: number
  height?: number
  fill?: string
  selected?: boolean
  meta?: {
    isMovable?: boolean
    isDeletable?: boolean
    isResizable?: boolean
    isErasable?: boolean
  }
}
```

---

## 🧷 4. 구현 시 주의사항 (Cursor 대응)

* 모든 컴포넌트는 분리된 파일에 작성할 것. 절대 한 파일에 몰아넣지 말 것
* DOM 접근은 ref 기준으로만 (`getElementById` 사용 금지)
* drawCanvas와 baseCanvas는 **항상 동시에 존재**하며, `zIndex`로 구분됨
* useEffect는 각 상태 변경 (strokes, shapes, selectedId 등)에 따라 개별적으로 처리할 것
* 타이머, 자동도구복귀는 커스텀 훅으로 빼도 되지만 기능 정확성 최우선

---

이 구조를 기반으로 코드를 생성하고, 절대로 추론하여 새로운 구조를 만들지 마십시오. 명세 외의 임의 설계는 허용되지 않습니다.

💾 저장 버튼 → JSON 파일 다운로드
📁 불러오기 버튼 → 파일 선택 → 상태 복원
