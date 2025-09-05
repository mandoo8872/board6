import { useState, useCallback } from 'react';
import { ResizeState, Position, Size, ResizeHandle } from '../types';

const initialResizeState: ResizeState = {
  isResizing: false,
  resizedObjectId: null,
  resizeHandle: null,
  startPosition: { x: 0, y: 0 },
  startSize: { width: 0, height: 0 },
  startObjectPosition: { x: 0, y: 0 }
};

export const useResizeState = () => {
  const [resizeState, setResizeState] = useState<ResizeState>(initialResizeState);

  const startResize = useCallback((
    objectId: string, 
    handle: ResizeHandle, 
    startPosition: Position,
    startSize: Size,
    startObjectPosition: Position
  ) => {
    setResizeState({
      isResizing: true,
      resizedObjectId: objectId,
      resizeHandle: handle,
      startPosition,
      startSize,
      startObjectPosition
    });
  }, []);

  const updateResize = useCallback((size?: Size, position?: Position) => {
    setResizeState(prev => ({
      ...prev,
      currentSize: size,
      currentPosition: position
    }));
  }, []);

  const endResize = useCallback(() => {
    setResizeState(initialResizeState);
  }, []);

  const isResizingObject = useCallback((objectId: string) => {
    return resizeState.isResizing && resizeState.resizedObjectId === objectId;
  }, [resizeState.isResizing, resizeState.resizedObjectId]);

  return {
    resizeState,
    startResize,
    updateResize,
    endResize,
    isResizingObject
  };
};