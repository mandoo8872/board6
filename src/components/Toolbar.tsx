import React, { useState, useCallback } from 'react'
import { DrawingTool, CommandTool } from '../types'

interface ToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onCommand: (command: CommandTool) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
  penColor?: string
  onPenColorChange?: (color: string) => void
  penSize?: number
  onPenSizeChange?: (size: number) => void
  showGrid?: boolean
  onShowGridChange?: (show: boolean) => void
  onEditEnd?: (shapes: any[]) => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  onCommand,
  gridSize,
  onGridSizeChange,
  penColor,
  onPenColorChange,
  penSize,
  onPenSizeChange,
  showGrid = false,
  onShowGridChange,
  onEditEnd
}) => {
  const [showGridDropdown, setShowGridDropdown] = useState(false)
  
  const gridSizeOptions = [16, 40, 64, 100, 128]

  // 2줄로 나눈 그리기 도구 (DrawingTool 타입 사용)
  const drawingTools: { command: DrawingTool; label: string; icon: string }[][] = [
    [
      { command: 'select', label: '선택', icon: '👆' },
      { command: 'pen', label: '펜', icon: '✏️' },
      { command: 'eraser', label: '지우개', icon: '🧹' }
    ],
    [
      { command: 'image', label: '이미지', icon: '🖼️' },
      { command: 'text', label: '텍스트', icon: '🅰️' },
      { command: 'rect', label: '사각형', icon: '⬜' }
    ]
  ]

  const commandToolsRow1: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'undo', label: '실행취소', icon: '↩️' },
    { command: 'redo', label: '다시실행', icon: '↪️' }
  ];
  const commandToolsRow2: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'save', label: '저장', icon: '💾' },
    { command: 'load', label: '불러오기', icon: '📁' }
  ];

  const handleImageUpload = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = (event) => {
        if (event.target?.result) {
          const imageUrl = event.target.result as string
          if (onCommand) {
            onCommand('image')
          }
          // 이미지 업로드 후 선택 도구로 전환
          onToolChange('select')
        }
      }
      reader.readAsDataURL(file)
    }
    e.target.value = ''
  }, [onCommand, onToolChange])

  const handleToolClick = useCallback((selectedTool: DrawingTool) => {
    if (selectedTool === currentTool) {
      onToolChange('select')
    } else {
      onToolChange(selectedTool)
      if (selectedTool === 'image') {
        const fileInput = document.createElement('input')
        fileInput.type = 'file'
        fileInput.accept = 'image/*'
        fileInput.onchange = (e) => handleImageUpload(e as any)
        fileInput.click()
      }
    }
  }, [currentTool, onToolChange, handleImageUpload])

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 1000
    }}>
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        width: '280px',
        backgroundColor: 'white',
        borderRadius: '12px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        pointerEvents: 'auto'
      }}>
        {/* 그리기 도구 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#555', marginBottom: '2px' }}>그리기 도구</div>
          {/* 2줄로 나누어 렌더링 */}
          {drawingTools.map((row, rowIdx) => (
            <div key={rowIdx} style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start', marginBottom: rowIdx === 0 ? '6px' : 0 }}>
              {row.map(({ command, label, icon }) => (
                <button
                  key={command}
                  onClick={() => handleToolClick(command as DrawingTool)}
                  style={{
                    padding: '14px 0 8px 0',
                    border: currentTool === command ? '2px solid #0066ff' : '1px solid #ccc',
                    borderRadius: '10px',
                    backgroundColor: currentTool === command ? '#f0f8ff' : 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    minWidth: '54px',
                    minHeight: '62px',
                    boxSizing: 'border-box',
                    fontWeight: 600
                  }}
                  title={label}
                >
                  <span style={{ fontSize: '24px' }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          ))}
        </div>

        {/* 펜 설정 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#555', marginBottom: '2px' }}>펜 설정</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* 색상 설정 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#555', minWidth: '40px' }}>색상:</label>
              <input
                type="color"
                value={penColor}
                onChange={(e) => onPenColorChange?.(e.target.value)}
                style={{ 
                  width: '40px', 
                  height: '40px', 
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  padding: '2px'
                }}
              />
            </div>
            {/* 크기 설정 */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '14px', fontWeight: 600, color: '#555', minWidth: '40px' }}>크기:</label>
              <input
                type="range"
                min="1"
                max="20"
                value={penSize}
                onChange={(e) => onPenSizeChange?.(Number(e.target.value))}
                style={{ flex: 1 }}
              />
              <span style={{ fontSize: '14px', fontWeight: 600, color: '#555', minWidth: '24px', textAlign: 'right' }}>
                {penSize}
              </span>
            </div>
          </div>
        </div>

        {/* 명령 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#555', marginBottom: '2px' }}>명령</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              {commandToolsRow1.map(({ command, label, icon }) => (
                <button
                  key={command}
                  onClick={() => onCommand(command)}
                  style={{
                    padding: '12px 0 8px 0',
                    border: '1.5px solid #ccc',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    minWidth: '62px',
                    minHeight: '62px',
                    boxSizing: 'border-box',
                    fontWeight: 600
                  }}
                  title={label}
                >
                  <span style={{ fontSize: '22px' }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
              {commandToolsRow2.map(({ command, label, icon }) => (
                <button
                  key={command}
                  onClick={() => onCommand(command)}
                  style={{
                    padding: '12px 0 8px 0',
                    border: '1.5px solid #ccc',
                    borderRadius: '10px',
                    backgroundColor: 'white',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '6px',
                    fontSize: '14px',
                    minWidth: '62px',
                    minHeight: '62px',
                    boxSizing: 'border-box',
                    fontWeight: 600
                  }}
                  title={label}
                >
                  <span style={{ fontSize: '22px' }}>{icon}</span>
                  <span>{label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 기타 */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <div style={{ fontSize: '15px', fontWeight: 700, color: '#555', marginBottom: '2px' }}>기타</div>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
            {/* 그리드 버튼 */}
            <div style={{ position: 'relative', flex: 1, minWidth: '90px' }}>
              <button
                onClick={() => setShowGridDropdown(!showGridDropdown)}
                style={{
                  padding: '12px 0 8px 0',
                  border: '1.5px solid #ccc',
                  borderRadius: '10px',
                  backgroundColor: 'white',
                  cursor: 'pointer',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '14px',
                  minWidth: '62px',
                  minHeight: '62px',
                  width: '100%',
                  boxSizing: 'border-box',
                  fontWeight: 600
                }}
                title={`그리드 (현재: ${gridSize}px)`}
              >
                <span style={{ fontSize: '22px' }}>⚏</span>
                <span>그리드</span>
                <span style={{ fontSize: '11px', color: '#888' }}>{gridSize}px</span>
              </button>
              {showGridDropdown && (
                <div style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  right: 0,
                  backgroundColor: 'white',
                  border: '1.5px solid #ccc',
                  borderRadius: '10px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  zIndex: 1001,
                  marginTop: '2px'
                }}>
                  {/* 그리드 표시/숨김 스위치 */}
                  <div style={{
                    padding: '8px 12px',
                    borderBottom: '1px solid #eee',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <span style={{ fontSize: '14px', color: '#333' }}>그리드 표시</span>
                    <label style={{
                      position: 'relative',
                      display: 'inline-block',
                      width: '40px',
                      height: '20px'
                    }}>
                      <input
                        type="checkbox"
                        checked={showGrid}
                        onChange={(e) => onShowGridChange?.(e.target.checked)}
                        style={{
                          opacity: 0,
                          width: 0,
                          height: 0
                        }}
                      />
                      <span style={{
                        position: 'absolute',
                        cursor: 'pointer',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: showGrid ? '#0066ff' : '#ccc',
                        transition: '.4s',
                        borderRadius: '20px'
                      }}>
                        <span style={{
                          position: 'absolute',
                          content: '""',
                          height: '16px',
                          width: '16px',
                          left: '2px',
                          bottom: '2px',
                          backgroundColor: 'white',
                          transition: '.4s',
                          borderRadius: '50%',
                          transform: showGrid ? 'translateX(20px)' : 'translateX(0)'
                        }}></span>
                      </span>
                    </label>
                  </div>
                  {/* 그리드 크기 옵션 */}
                  {gridSizeOptions.map((size) => (
                    <button
                      key={size}
                      onClick={() => {
                        onGridSizeChange?.(size)
                        setShowGridDropdown(false)
                      }}
                      style={{
                        width: '100%',
                        padding: '12px',
                        border: 'none',
                        backgroundColor: gridSize === size ? '#f0f8ff' : 'white',
                        color: gridSize === size ? '#0066ff' : '#333',
                        cursor: 'pointer',
                        fontSize: '14px',
                        textAlign: 'left',
                        borderBottom: '1px solid #eee'
                      }}
                    >
                      {size}px
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Toolbar 