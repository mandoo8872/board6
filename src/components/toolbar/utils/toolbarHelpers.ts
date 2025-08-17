import { TextObject, ImageObject } from '../../../types';

/**
 * 엑셀 데이터를 파싱하여 2차원 배열로 변환
 */
export const parseExcelData = (data: string): string[][] => {
  if (!data.trim()) return [];
  
  const rows = data.split('\n').filter(row => row.trim() !== '');
  return rows.map(row => row.split('\t'));
};

/**
 * 색상 팔레트 기본값
 */
export const DEFAULT_COLOR_PALETTE = [
  '#000000', '#ffffff', '#cccccc', '#ff0000', '#00ff00', '#0000ff',
  '#ffff00', '#ff00ff', '#00ffff', '#ffa500', '#800080'
];

/**
 * 기본 도구 목록
 */
export const DEFAULT_TOOLS = [
  { id: 'select', label: '선택', icon: '👆' },
  { id: 'text', label: '텍스트', icon: '📝' },
  { id: 'checkbox', label: '체크', icon: '☑️' },
  { id: 'image', label: '이미지', icon: '🖼️' },
  { id: 'pen', label: '필기', icon: '✏️' },
  { id: 'eraser', label: '지우개', icon: '🧽' },
];

/**
 * 타입 가드: TextObject 여부 확인
 */
export const isTextObject = (obj: any): obj is TextObject => {
  return obj && typeof obj.hasCheckbox !== 'undefined';
};

/**
 * 타입 가드: ImageObject 여부 확인
 */
export const isImageObject = (obj: any): obj is ImageObject => {
  return obj && typeof obj.src !== 'undefined';
};

/**
 * 엑셀 셀이 선택되었는지 확인
 */
export const isExcelCellSelected = (selectedObject: any): boolean => {
  return selectedObject && 'cellType' in selectedObject && selectedObject.cellType === 'cell';
};

/**
 * 현재 색상 가져오기
 */
export const getCurrentColor = (
  selectedObject: any, 
  colorMode: 'text' | 'background' | 'border'
): string => {
  if (!selectedObject || !isTextObject(selectedObject)) return '#000000';
  
  switch (colorMode) {
    case 'text':
      return selectedObject.textStyle?.color || '#000000';
    case 'background':
      return selectedObject.boxStyle?.backgroundColor || 'transparent';
    case 'border':
      return selectedObject.boxStyle?.borderColor || '#000000';
    default:
      return '#000000';
  }
};

/**
 * 객체의 모든 zIndex 중 최대값 찾기
 */
export const getMaxZIndex = (textObjects: TextObject[], imageObjects: ImageObject[]): number => {
  const allObjects = [...textObjects, ...imageObjects];
  return Math.max(...allObjects.map(obj => obj.zIndex || 0));
};

/**
 * 객체의 모든 zIndex 중 최소값 찾기
 */
export const getMinZIndex = (textObjects: TextObject[], imageObjects: ImageObject[]): number => {
  const allObjects = [...textObjects, ...imageObjects];
  return Math.min(...allObjects.map(obj => obj.zIndex || 0));
};

/**
 * 현재 객체보다 높은 zIndex 중 가장 작은 값 찾기
 */
export const getNextHigherZIndex = (
  currentZIndex: number, 
  textObjects: TextObject[], 
  imageObjects: ImageObject[]
): number | null => {
  const allObjects = [...textObjects, ...imageObjects];
  const higherObjects = allObjects.filter(obj => (obj.zIndex || 0) > currentZIndex);
  
  if (higherObjects.length === 0) return null;
  return Math.min(...higherObjects.map(obj => obj.zIndex || 0));
};

/**
 * 현재 객체보다 낮은 zIndex 중 가장 큰 값 찾기
 */
export const getNextLowerZIndex = (
  currentZIndex: number, 
  textObjects: TextObject[], 
  imageObjects: ImageObject[]
): number | null => {
  const allObjects = [...textObjects, ...imageObjects];
  const lowerObjects = allObjects.filter(obj => (obj.zIndex || 0) < currentZIndex);
  
  if (lowerObjects.length === 0) return null;
  return Math.max(...lowerObjects.map(obj => obj.zIndex || 0));
};

/**
 * 엑셀 데이터의 행과 열 수 계산
 */
export const getExcelDataDimensions = (data: string): { rows: number; cols: number } => {
  const parsedData = parseExcelData(data);
  if (parsedData.length === 0) return { rows: 0, cols: 0 };
  
  const rowCount = parsedData.length;
  const colCount = Math.max(...parsedData.map(row => row.length));
  
  return { rows: rowCount, cols: colCount };
};

/**
 * 입력 요소인지 확인
 */
export const isInputElement = (target: HTMLElement): boolean => {
  return target.tagName === 'INPUT' || 
         target.tagName === 'TEXTAREA' || 
         target.isContentEditable ||
         target.closest('input, textarea, [contenteditable]') !== null;
};

/**
 * 캔버스 컨테이너인지 확인
 */
export const isCanvasContainer = (element: HTMLElement): boolean => {
  return element.hasAttribute('data-canvas-container') || 
         (element.tabIndex === 0 && element.tagName === 'DIV');
};