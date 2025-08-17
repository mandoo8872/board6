import React from 'react';
import { useAdminConfigStore } from '../../store/adminConfigStore';
import { useEditorStore } from '../../store/editorStore';
import { TextObjectRenderer, ImageObjectRenderer } from './BaseLayer/components';
import { useCanvasInteractions } from './BaseLayer/hooks';
import { BaseLayerProps, TextObjectData, ImageObjectData } from './BaseLayer/types';

const BaseLayer: React.FC<BaseLayerProps> = ({ isViewPage = false }) => {
  const { textObjects, imageObjects, updateTextObject } = useAdminConfigStore();
  const { selectedObjectId, hoveredObjectId, currentTool } = useEditorStore();
  const { 
    dragState,
    resizeState,
    editingObjectId,
    editingText,
    isDraggingObject,
    isResizingObject,
    updateEditingText,
    finishInlineEdit,
    cancelInlineEdit,
    onCanvasKeyDown,
    onPointerDown,
    onResizePointerDown,
    onPointerMove,
    onPointerUp,
    onObjectClick,
    onCanvasClick,
    onTextBoxClick,
    handleContextMenu,
    handleKeyDown,
    setHoveredObjectId: setHovered
  } = useCanvasInteractions(isViewPage);

  return (
    <div 
      className="absolute inset-0"
      tabIndex={0}
      onClick={onCanvasClick}
      onKeyDown={onCanvasKeyDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerLeave={onPointerUp}
      onContextMenu={handleContextMenu}
      style={{
        touchAction: 'none',
        pointerEvents: 'auto',
        outline: 'none'
      }}
    >
      {/* 모든 객체를 zIndex 순서대로 정렬하여 렌더링 */}
      {[...textObjects, ...imageObjects]
        // 안정 정렬: zIndex 우선, 동률일 때 id로 2차 정렬
        .sort((a: any, b: any) => {
          const za = a.zIndex || 0;
          const zb = b.zIndex || 0;
          if (za !== zb) return za - zb;
          const ida = (a.id || '').toString();
          const idb = (b.id || '').toString();
          return ida.localeCompare(idb);
        })
        .map((obj) => {
          const isTextObject = 'text' in obj;
          const isImageObject = 'src' in obj;
          
          // 드래그 중인 객체의 현재 위치 계산
          const isDragging = isDraggingObject(obj.id);
          const isResizing = isResizingObject(obj.id);
          
          const currentX = isDragging ? dragState.currentPosition.x : 
                          isResizing && resizeState.currentPosition ? resizeState.currentPosition.x : obj.x;
          const currentY = isDragging ? dragState.currentPosition.y : 
                          isResizing && resizeState.currentPosition ? resizeState.currentPosition.y : obj.y;
          const currentWidth = isResizing && resizeState.currentSize ? resizeState.currentSize.width : obj.width;
          const currentHeight = isResizing && resizeState.currentSize ? resizeState.currentSize.height : obj.height;
          
          const isSelected = selectedObjectId === obj.id;
          const isHovered = hoveredObjectId === obj.id && !isViewPage;
          
          if (isTextObject) {
            return (
              <TextObjectRenderer
                key={obj.id}
                obj={obj as TextObjectData}
                isSelected={isSelected}
                isHovered={isHovered}
                isViewPage={isViewPage}
                isDragging={isDragging}
                isResizing={isResizing}
                currentX={currentX}
                currentY={currentY}
                currentWidth={currentWidth}
                currentHeight={currentHeight}
                currentTool={currentTool}
                editingObjectId={editingObjectId}
                editingText={editingText}
                 onTextBoxClick={onTextBoxClick}
                 onObjectClick={onObjectClick}
                 onPointerDown={onPointerDown}
                 onResizePointerDown={onResizePointerDown}
                 onMouseEnter={() => setHovered(obj.id)}
                 onMouseLeave={() => setHovered(null)}
                onEditingTextChange={updateEditingText}
                onFinishEdit={finishInlineEdit}
                onKeyDown={(e) => handleKeyDown(e, finishInlineEdit, cancelInlineEdit)}
                updateTextObject={updateTextObject}
              />
            );
          } else if (isImageObject) {
            return (
              <ImageObjectRenderer
                key={obj.id}
                obj={obj as ImageObjectData}
                isSelected={isSelected}
                isHovered={isHovered}
                isViewPage={isViewPage}
                isDragging={isDragging}
                currentX={currentX}
                currentY={currentY}
                currentWidth={currentWidth}
                currentHeight={currentHeight}
                currentTool={currentTool}
                editingObjectId={editingObjectId}
                 onObjectClick={onObjectClick}
                 onPointerDown={onPointerDown}
                 onResizePointerDown={onResizePointerDown}
                 onMouseEnter={() => setHovered(obj.id)}
                 onMouseLeave={() => setHovered(null)}
              />
            );
          }
          
          return null;
        })}
    </div>
  );
};

export default BaseLayer;