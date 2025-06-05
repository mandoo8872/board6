import React, { useState, useEffect } from 'react'
import { Shape } from '../types'

interface PropertiesPanelProps {
  selectedShape: Shape | null
  onUpdateShape: (property: keyof Shape, value: any) => void
  onUpdateShapeComplete: (updates: Partial<Shape>) => void
  onDeleteShape: () => void
  onDuplicateShape: () => void
  onBringToFront?: (shapeId: string) => void
  onSendToBack?: (shapeId: string) => void
  onMoveForward?: (shapeId: string) => void
  onMoveBackward?: (shapeId: string) => void
}

const PropertiesPanel: React.FC<PropertiesPanelProps> = ({
  selectedShape,
  onUpdateShape,
  onUpdateShapeComplete,
  onDeleteShape,
  onDuplicateShape,
  onBringToFront,
  onSendToBack,
  onMoveForward,
  onMoveBackward
}) => {
  const [localFill, setLocalFill] = useState<string>('#ffffff')
  const [localOpacity, setLocalOpacity] = useState<number>(1)

  // 선택된 객체가 변경될 때 로컬 상태 초기화
  useEffect(() => {
    if (selectedShape) {
      setLocalFill(selectedShape.fill || '#ffffff')
      setLocalOpacity(selectedShape.opacity ?? 1)
    }
  }, [selectedShape])

  if (!selectedShape) return null

  const handleColorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newColor = e.target.value
    setLocalFill(newColor)
    onUpdateShape('fill', newColor)
  }

  const handleColorComplete = () => {
    onUpdateShapeComplete({
      ...selectedShape,
      fill: localFill
    })
  }

  const handleOpacityChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newOpacity = parseFloat(e.target.value)
    setLocalOpacity(newOpacity)
    onUpdateShape('opacity', newOpacity)
  }

  const handleOpacityComplete = () => {
    onUpdateShapeComplete({
      ...selectedShape,
      opacity: localOpacity
    })
  }

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      right: '20px',
      zIndex: 1000,
      backgroundColor: 'white',
      padding: '15px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      minWidth: '200px'
    }}>
      <div style={{ 
        fontSize: '14px', 
        fontWeight: 'bold', 
        marginBottom: '10px',
        color: '#333'
      }}>
        객체 속성
      </div>

      {/* Basic Properties */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
          기본 정보
        </div>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '40px' }}>타입:</label>
            <span style={{ fontSize: '11px', color: '#666' }}>{selectedShape.type}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '40px' }}>X:</label>
            <input
              type="number"
              value={selectedShape.x}
              onChange={(e) => onUpdateShape('x', Number(e.target.value))}
              style={{ 
                width: '60px', 
                padding: '2px 4px', 
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '40px' }}>Y:</label>
            <input
              type="number"
              value={selectedShape.y}
              onChange={(e) => onUpdateShape('y', Number(e.target.value))}
              style={{ 
                width: '60px', 
                padding: '2px 4px', 
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '40px' }}>폭:</label>
            <input
              type="number"
              value={selectedShape.width || 100}
              onChange={(e) => onUpdateShape('width', Number(e.target.value))}
              style={{ 
                width: '60px', 
                padding: '2px 4px', 
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '40px' }}>높이:</label>
            <input
              type="number"
              value={selectedShape.height || 60}
              onChange={(e) => onUpdateShape('height', Number(e.target.value))}
              style={{ 
                width: '60px', 
                padding: '2px 4px', 
                fontSize: '11px',
                border: '1px solid #ccc',
                borderRadius: '3px'
              }}
            />
          </div>
        </div>
      </div>

      {/* Type-specific Properties */}
      {selectedShape.type === 'rect' && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
            사각형 설정
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>배경:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={localFill}
                  onChange={handleColorChange}
                  onMouseUp={handleColorComplete}
                  onBlur={handleColorComplete}
                  style={{ width: '30px', height: '20px', border: 'none', borderRadius: '3px' }}
                  disabled={selectedShape.meta?.noBackground === true}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={selectedShape.meta?.noBackground === true}
                    onChange={(e) => onUpdateShape('meta', { 
                      ...selectedShape.meta, 
                      noBackground: e.target.checked 
                    })}
                  />
                  배경 없음
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>투명도:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localOpacity}
                onChange={handleOpacityChange}
                onMouseUp={handleOpacityComplete}
                onBlur={handleOpacityComplete}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'right' }}>
                {Math.round(localOpacity * 100)}%
              </span>
            </div>
          </div>
        </div>
      )}

      {selectedShape.type === 'text' && (
        <div style={{ marginBottom: '15px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
            텍스트 설정
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>내용:</label>
              <input
                type="text"
                value={selectedShape.text || 'Text'}
                onChange={(e) => onUpdateShape('text', e.target.value)}
                style={{ 
                  flex: 1, 
                  padding: '2px 4px', 
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>크기:</label>
              <input
                type="number"
                value={selectedShape.fontSize || 16}
                onChange={(e) => onUpdateShape('fontSize', Number(e.target.value))}
                min="8"
                max="72"
                style={{ 
                  width: '60px', 
                  padding: '2px 4px', 
                  fontSize: '11px',
                  border: '1px solid #ccc',
                  borderRadius: '3px'
                }}
              />
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>배경:</label>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input
                  type="color"
                  value={localFill}
                  onChange={handleColorChange}
                  onMouseUp={handleColorComplete}
                  onBlur={handleColorComplete}
                  style={{ width: '30px', height: '20px', border: 'none', borderRadius: '3px' }}
                  disabled={selectedShape.meta?.noBackground === true}
                />
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={selectedShape.meta?.noBackground === true}
                    onChange={(e) => onUpdateShape('meta', { 
                      ...selectedShape.meta, 
                      noBackground: e.target.checked 
                    })}
                  />
                  배경 없음
                </label>
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>투명도:</label>
              <input
                type="range"
                min="0"
                max="1"
                step="0.1"
                value={localOpacity}
                onChange={handleOpacityChange}
                onMouseUp={handleOpacityComplete}
                onBlur={handleOpacityComplete}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '11px', minWidth: '30px', textAlign: 'right' }}>
                {Math.round(localOpacity * 100)}%
              </span>
            </div>
            
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '40px' }}>스타일:</label>
              <div style={{ display: 'flex', gap: '5px' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={selectedShape.fontWeight === 'bold'}
                    onChange={(e) => onUpdateShape('fontWeight', e.target.checked ? 'bold' : 'normal')}
                  />
                  Bold
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '3px', fontSize: '11px' }}>
                  <input
                    type="checkbox"
                    checked={selectedShape.fontStyle === 'italic'}
                    onChange={(e) => onUpdateShape('fontStyle', e.target.checked ? 'italic' : 'normal')}
                  />
                  Italic
                </label>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <label style={{ fontSize: '11px' }}>텍스트 정렬</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {/* 수평 정렬 */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onUpdateShape('textAlign', 'left')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.textAlign === 'left' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="왼쪽 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇤</span>
                  </button>
                  <button
                    onClick={() => onUpdateShape('textAlign', 'center')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.textAlign === 'center' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="가운데 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇔</span>
                  </button>
                  <button
                    onClick={() => onUpdateShape('textAlign', 'right')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.textAlign === 'right' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="오른쪽 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇥</span>
                  </button>
                </div>
                {/* 수직 정렬 */}
                <div style={{ display: 'flex', gap: '4px' }}>
                  <button
                    onClick={() => onUpdateShape('verticalAlign', 'top')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.verticalAlign === 'top' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="위 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇧</span>
                  </button>
                  <button
                    onClick={() => onUpdateShape('verticalAlign', 'middle')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.verticalAlign === 'middle' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="중앙 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇕</span>
                  </button>
                  <button
                    onClick={() => onUpdateShape('verticalAlign', 'bottom')}
                    style={{
                      width: '24px',
                      height: '24px',
                      padding: '2px',
                      border: '1px solid #ccc',
                      borderRadius: '3px',
                      backgroundColor: selectedShape.verticalAlign === 'bottom' ? '#e3e3e3' : 'white',
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center'
                    }}
                    title="아래 정렬"
                  >
                    <span style={{ fontSize: '14px' }}>⇩</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Meta Properties */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
          권한 설정
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={selectedShape.meta?.isMovable !== false}
              onChange={(e) => onUpdateShape('meta', { 
                ...selectedShape.meta, 
                isMovable: e.target.checked 
              })}
            />
            이동 가능
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={selectedShape.meta?.isDeletable !== false}
              onChange={(e) => onUpdateShape('meta', { 
                ...selectedShape.meta, 
                isDeletable: e.target.checked 
              })}
            />
            삭제 가능
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={selectedShape.meta?.isResizable !== false}
              onChange={(e) => onUpdateShape('meta', { 
                ...selectedShape.meta, 
                isResizable: e.target.checked 
              })}
            />
            크기 조절 가능
          </label>
          <label style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px' }}>
            <input
              type="checkbox"
              checked={selectedShape.meta?.isErasable === true}
              onChange={(e) => onUpdateShape('meta', { 
                ...selectedShape.meta, 
                isErasable: e.target.checked 
              })}
            />
            지우개로 삭제 가능
          </label>
        </div>
      </div>

      {/* Layer Order Controls */}
      <div style={{ marginBottom: '15px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666', marginBottom: '5px' }}>
          레이어 정렬
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '5px' }}>
          <button
            onClick={() => onBringToFront?.(selectedShape.id)}
            style={{
              padding: '6px 4px',
              fontSize: '10px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            맨 앞으로
          </button>
          <button
            onClick={() => onSendToBack?.(selectedShape.id)}
            style={{
              padding: '6px 4px',
              fontSize: '10px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            맨 뒤로
          </button>
          <button
            onClick={() => onMoveForward?.(selectedShape.id)}
            style={{
              padding: '6px 4px',
              fontSize: '10px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            앞으로
          </button>
          <button
            onClick={() => onMoveBackward?.(selectedShape.id)}
            style={{
              padding: '6px 4px',
              fontSize: '10px',
              border: '1px solid #ddd',
              borderRadius: '3px',
              backgroundColor: 'white',
              cursor: 'pointer',
              whiteSpace: 'nowrap'
            }}
          >
            뒤로
          </button>
        </div>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px' }}>
        <button
          onClick={onDuplicateShape}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '11px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: 'white',
            cursor: 'pointer'
          }}
        >
          복제
        </button>
        <button
          onClick={onDeleteShape}
          disabled={selectedShape.meta?.isDeletable === false}
          style={{
            flex: 1,
            padding: '6px 8px',
            fontSize: '11px',
            border: '1px solid #ff4444',
            borderRadius: '4px',
            backgroundColor: selectedShape.meta?.isDeletable === false ? '#f5f5f5' : '#ffe6e6',
            color: selectedShape.meta?.isDeletable === false ? '#ccc' : '#ff4444',
            cursor: selectedShape.meta?.isDeletable === false ? 'not-allowed' : 'pointer'
          }}
        >
          삭제
        </button>
      </div>
    </div>
  )
}

export default PropertiesPanel 