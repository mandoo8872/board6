**📁 Board 6 전용 파일구조 설계 및 Cursor용 명세 (v1.1 - 2024.06.04 기준)**

---

## 📦 1. 디렉토리 구조 (기본)

```bash
src/
├── components/
│   ├── CanvasWrapper.tsx        # 전체 캔버스와 도구 상태 통합 컨테이너
│   ├── DrawLayer.tsx            # drawCanvas 전용: 필기, 지우개
│   ├── BaseLayer.tsx            # baseCanvas 전용: 객체, 그리드
│   ├── FloatingToolbar.tsx      # 플로팅 툴바 (도구 선택, 크기/투명도 조절)
│   ├── PropertiesPanel.tsx      # 우상단 객체 속성 제어 패널
│   ├── TextBoxPanel.tsx         # 텍스트 박스 전용 속성 패널
│   └── InteractionLayer.tsx     # pointer 이벤트 핸들링, 도구 전환, 선택 등
├── hooks/
│   ├── useStroke.ts             # stroke 관리 훅 (add/remove 등)
│   ├── useShapes.ts             # shape 선택, 이동, 삭제 등
│   ├── useBoardStorage.ts       # 저장/불러오기 관리
│   ├── useTextBox.ts            # 텍스트 박스 생성 및 편집 관리
│   └── useToolbar.ts            # 플로팅 툴바 상태 관리
├── types/
│   └── index.ts                 # Stroke, Shape, Tool 등 공통 타입 정의
├── utils/
│   ├── canvasHelpers.ts         # drawStroke, drawGrid 등 공통 캔버스 렌더 함수
│   ├── debounceThrottle.ts      # 이벤트 최적화 유틸리티 (debounce/throttle)
│   ├── syncUtils.ts             # 동기화 관련 유틸리티 (콜백 등)
│   ├── objectFactory.ts         # 객체 생성 유틸리티 (텍스트 박스 포함)
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

### 🎨 FloatingToolbar.tsx

* 플로팅 툴바 UI 및 상태 관리
* props: `tool`, `penColor`, `penSize`, `opacity`, `onToolChange`, `onPenColorChange`, `onPenSizeChange`, `onOpacityChange`
* 역할:
  * 도구 버튼 UI
  * 색상/크기/투명도 조절 UI
  * 드래그/리사이즈 처리
  * 상태 저장/복원

### 🧾 PropertiesPanel.tsx

* 선택된 객체의 `meta` 설정 UI (`isMovable`, `isDeletable`, `isResizable`, `isErasable` 등)
* 위치: 우상단 고정, 선택된 객체 있을 때만 렌더링

### 🕹 InteractionLayer.tsx

* 모든 pointer 이벤트 처리
* 도구에 따라 이벤트 라우팅
  * pen/eraser → DrawLayer 핸들러 호출
  * select/rect → BaseLayer hitTest 및 생성/선택 처리
* 자동 도구 복귀 타이머 포함 (2초)

### 🕹 TextBoxPanel.tsx

* 텍스트 박스 전용 속성 패널
* 위치: 우상단 고정, 선택된 객체 있을 때만 렌더링

---

## 📂 3. Hooks & Types

### `useStroke.ts`

* stroke 추가, 삭제, 복원 관리
* 필기 타이머 내부 포함 가능

### `useShapes.ts`

* shape 선택, 이동, 삭제, 복제
* meta 기반 기능 제한 처리 포함 (e.g. isMovable)

### `useBoardStorage.ts`

* 실시간 동기화 관리
* localStorage fallback 처리
* JSON 파일 저장/불러오기
* debounce/throttle을 통한 동기화 최적화

### `useTextBox.ts`

* 텍스트 박스 생성 및 편집 관리

### `useToolbar.ts`

* 플로팅 툴바 상태 관리
* 드래그/리사이즈 처리
* localStorage 저장/복원

### `types/index.ts`

```ts
export type Tool = 'pen' | 'eraser' | 'select' | 'rect' | 'text'
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

export interface TextBox extends Shape {
  type: 'text'
  content: string
  backgroundColor: string
  opacity: number
  textAlign: 'left' | 'center' | 'right'
  verticalAlign: 'top' | 'middle' | 'bottom'
}

export interface ToolbarState {
  x: number
  y: number
  width: number
  height: number
  opacity: number
}
```

---

## 🧷 4. 구현 시 주의사항 (Cursor 대응)

* 모든 컴포넌트는 분리된 파일에 작성할 것. 절대 한 파일에 몰아넣지 말 것
* DOM 접근은 ref 기준으로만 (`getElementById` 사용 금지)
* drawCanvas와 baseCanvas는 **항상 동시에 존재**하며, `zIndex`로 구분됨
* useEffect는 각 상태 변경 (strokes, shapes, selectedId 등)에 따라 개별적으로 처리할 것
* 타이머, 자동도구복귀는 커스텀 훅으로 빼도 되지만 기능 정확성 최우선
* 동기화는 useBoardStorage 훅을 통해서만 처리할 것
* 동기화 시 debounce/throttle을 적절히 사용하여 성능 최적화할 것
* 텍스트 박스는 사이드 패널에서만 편집 가능하도록 제한할 것
* 클립보드 붙여넣기 시 텍스트 박스 자동 생성 기능 구현할 것
* 플로팅 툴바는 상단 20px 영역에서만 드래그 가능하도록 제한할 것
* 플로팅 툴바의 크기/투명도 조절 바는 드래그 영역과 겹치지 않도록 처리할 것

---

이 구조를 기반으로 코드를 생성하고, 절대로 추론하여 새로운 구조를 만들지 마십시오. 명세 외의 임의 설계는 허용되지 않습니다.

💾 저장 버튼 → JSON 파일 다운로드
📁 불러오기 버튼 → 파일 선택 → 상태 복원

* **그리드(Grid):**

  * 캔버스에는 항상 표시되며 사용자 설정 없이 기본적으로 활성화됨
  * `baseCanvas`에서 shape와 함께 렌더링되며, 객체 배치 시 시각적 기준선 제공
  * **최초 페이지 로드시 그리드 표시가 꺼진 상태(off)가 기본값임**
