import { TextObjectData } from '../types';

// 컨텍스트 메뉴 방지 (우클릭, 터치 길게 누르기)
export const handleContextMenu = (e: React.MouseEvent) => {
  try {
    e.preventDefault();
    e.stopPropagation();
  } catch (error) {
    // passive event listener에서 preventDefault() 실패 시 무시
    console.debug('preventDefault failed in context menu handler:', error);
  }
  return false;
};

// 키 입력 처리 (Enter, Escape)
export const handleKeyDown = (
  e: React.KeyboardEvent,
  finishInlineEdit: () => void,
  cancelInlineEdit: () => void
) => {
  if (e.key === 'Enter' && !e.shiftKey) {
    // Enter: 줄바꿈 허용 (편집 완료하지 않음)
    return;
  } else if (e.key === 'Enter' && e.shiftKey) {
    // Shift+Enter: 편집 완료
    try {
      e.preventDefault();
    } catch (error) {
      console.debug('preventDefault failed in keydown handler:', error);
    }
    finishInlineEdit();
  } else if (e.key === 'Escape') {
    try {
      e.preventDefault();
    } catch (error) {
      console.debug('preventDefault failed in keydown handler:', error);
    }
    cancelInlineEdit();
  }
};

// 셀 범위 선택 계산
export const calculateCellRange = (
  fromCell: TextObjectData,
  toCell: TextObjectData,
  textObjects: TextObjectData[]
): string[] => {
  if (!fromCell.cellPosition || !toCell.cellPosition || fromCell.groupId !== toCell.groupId) {
    return [];
  }

  const startRow = Math.min(fromCell.cellPosition.row, toCell.cellPosition.row);
  const endRow = Math.max(fromCell.cellPosition.row, toCell.cellPosition.row);
  const startCol = Math.min(fromCell.cellPosition.col, toCell.cellPosition.col);
  const endCol = Math.max(fromCell.cellPosition.col, toCell.cellPosition.col);
  
  const rangeCellIds: string[] = [];
  textObjects.forEach(cell => {
    if (cell.cellType === 'cell' && cell.cellPosition && cell.groupId === fromCell.groupId) {
      const { row, col } = cell.cellPosition;
      if (row >= startRow && row <= endRow && col >= startCol && col <= endCol) {
        rangeCellIds.push(cell.id);
      }
    }
  });
  
  return rangeCellIds;
};

// 포인터 캡처 처리
export const handlePointerCapture = (
  e: React.PointerEvent,
  isIPhone: boolean,
  action: 'set' | 'release'
) => {
  if (action === 'set') {
    if (isIPhone) {
      // iPhone에서는 포인터 캡처를 더 조심스럽게 적용
      setTimeout(() => {
        try {
          e.currentTarget.setPointerCapture(e.pointerId);
        } catch (error) {
          // iPhone에서 포인터 캡처 실패는 무시하고 계속 진행
          console.debug('iPhone pointer capture failed, continuing without capture');
        }
      }, 0);
    } else {
      // iPad/데스크톱에서는 즉시 포인터 캡처
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch (error) {
        // 포인터 캡처 실패는 무시 (일부 브라우저에서 지원하지 않음)
      }
    }
  } else {
    // 포인터 캡처 해제
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (error) {
      // 포인터 캡처 해제 실패는 무시
    }
  }
};