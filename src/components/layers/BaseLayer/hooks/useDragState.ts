import { useState, useCallback } from 'react';
import { DragState, Position } from '../types';

const initialDragState: DragState = {
  isDragging: false,
  draggedObjectId: null,
  offset: { x: 0, y: 0 },
  currentPosition: { x: 0, y: 0 }
};

export const useDragState = () => {
  const [dragState, setDragState] = useState<DragState>(initialDragState);

  const startDrag = useCallback((objectId: string, offset: Position, currentPosition: Position) => {
    setDragState({
      isDragging: true,
      draggedObjectId: objectId,
      offset,
      currentPosition
    });
  }, []);

  const updateDragPosition = useCallback((position: Position) => {
    setDragState(prev => ({
      ...prev,
      currentPosition: position
    }));
  }, []);

  const endDrag = useCallback(() => {
    setDragState(initialDragState);
  }, []);

  const isDraggingObject = useCallback((objectId: string) => {
    return dragState.isDragging && dragState.draggedObjectId === objectId;
  }, [dragState.isDragging, dragState.draggedObjectId]);

  return {
    dragState,
    startDrag,
    updateDragPosition,
    endDrag,
    isDraggingObject
  };
};