import React, { useState } from 'react'
import { DrawingTool, CommandTool } from '../types'

interface ToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onCommand: (command: CommandTool) => void
  penColor: string
  penSize: number
  onPenColorChange: (color: string) => void
  onPenSizeChange: (size: number) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
  canUndo?: boolean
  canRedo?: boolean
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  onCommand,
  penColor,
  penSize,
  onPenColorChange,
  onPenSizeChange,
  gridSize,
  onGridSizeChange,
  canUndo = false,
  canRedo = false
}) => {
  const [showGridDropdown, setShowGridDropdown] = useState(false)
  
  const gridSizeOptions = [16, 40, 64, 100, 128]

  const drawingTools: { command: DrawingTool; label: string; icon: string }[] = [
    { command: 'select', label: '선택', icon: '👆' },
    { command: 'pen', label: '펜', icon: '✏️' },
    { command: 'eraser', label: '지우개', icon: '🧹' },
    { command: 'rect', label: '사각형', icon: '⬜' }
  ]

  const commandTools: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'undo', label: '실행취소', icon: '↩️' },
    { command: 'redo', label: '다시실행', icon: '↪️' },
    { command: 'image', label: '이미지', icon: '🖼️' }
  ]

  const layerTools: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'bringToFront', label: '앞으로', icon: '⬆️' },
    { command: 'sendToBack', label: '뒤로', icon: '⬇️' }
  ]

  const historyTools: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'undo', label: '실행취소', icon: '↩️' },
    { command: 'redo', label: '다시실행', icon: '↪️' }
  ]

  const fileTools: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'save', label: '저장', icon: '💾' },
    { command: 'load', label: '불러오기', icon: '📁' }
  ]

  const syncTools: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'push', label: 'Push', icon: '📤' },
    { command: 'pull', label: 'Pull', icon: '📥' }
  ]

  return (
    <div style={{
      position: 'absolute',
      top: '20px',
      left: '20px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
      backgroundColor: 'white',
      padding: '16px',
      borderRadius: '8px',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      border: '1px solid #e0e0e0',
      maxWidth: '240px'
    }}>
      
      {/* Drawing Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>그리기 도구</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {drawingTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onToolChange(command)}
              style={{
                padding: '8px 12px',
                border: currentTool === command ? '2px solid #0066ff' : '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: currentTool === command ? '#f0f8ff' : 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '11px',
                minWidth: '50px'
              }}
              title={label}
            >
              <span style={{ fontSize: '16px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Pen Settings */}
      {(currentTool === 'pen' || currentTool === 'eraser') && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>도구 설정</div>
          
          {currentTool === 'pen' && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <label style={{ fontSize: '11px', width: '30px' }}>색상:</label>
              <input
                type="color"
                value={penColor}
                onChange={(e) => onPenColorChange(e.target.value)}
                style={{ width: '32px', height: '24px', border: 'none', borderRadius: '3px' }}
              />
            </div>
          )}
          
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ fontSize: '11px', width: '30px' }}>크기:</label>
            <input
              type="range"
              min="1"
              max="20"
              value={penSize}
              onChange={(e) => onPenSizeChange(Number(e.target.value))}
              style={{ flex: 1 }}
            />
            <span style={{ fontSize: '11px', width: '24px', textAlign: 'center' }}>{penSize}</span>
          </div>
        </div>
      )}

      {/* Layer Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>레이어</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {layerTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onCommand(command)}
              style={{
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                minWidth: '60px',
                flex: 1
              }}
              title={label}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* History Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>편집</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {commandTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onCommand(command)}
              style={{
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                minWidth: '60px',
                flex: 1
              }}
              title={label}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* File Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>파일</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {fileTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onCommand(command)}
              style={{
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                minWidth: '60px',
                flex: 1
              }}
              title={label}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Sync Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>동기화</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {syncTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onCommand(command)}
              style={{
                padding: '6px 8px',
                border: '1px solid #007acc',
                borderRadius: '4px',
                backgroundColor: '#f0f8ff',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                minWidth: '60px',
                flex: 1,
                color: '#007acc'
              }}
              title={command === 'push' ? '현장으로 전송' : '현장에서 받기'}
            >
              <span style={{ fontSize: '14px' }}>{icon}</span>
              <span>{label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Settings Tools */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
        <div style={{ fontSize: '12px', fontWeight: 'bold', color: '#666' }}>기타</div>
        <div style={{ display: 'flex', gap: '5px' }}>
          {/* Grid Tool with Dropdown */}
          <div style={{ position: 'relative', flex: 1 }}>
            <button
              onClick={() => setShowGridDropdown(!showGridDropdown)}
              style={{
                padding: '6px 8px',
                border: '1px solid #ccc',
                borderRadius: '4px',
                backgroundColor: 'white',
                cursor: 'pointer',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '2px',
                fontSize: '10px',
                minWidth: '60px',
                width: '100%'
              }}
              title={`그리드 (현재: ${gridSize}px)`}
            >
              <span style={{ fontSize: '14px' }}>⚏</span>
              <span>그리드</span>
              <span style={{ fontSize: '8px' }}>{gridSize}px</span>
            </button>
            
            {showGridDropdown && (
              <div style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                right: 0,
                backgroundColor: 'white',
                border: '1px solid #ccc',
                borderRadius: '4px',
                boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                zIndex: 1001,
                marginTop: '2px'
              }}>
                {gridSizeOptions.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      onGridSizeChange?.(size)
                      setShowGridDropdown(false)
                    }}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: 'none',
                      backgroundColor: gridSize === size ? '#f0f8ff' : 'white',
                      color: gridSize === size ? '#0066ff' : '#333',
                      cursor: 'pointer',
                      fontSize: '11px',
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
          
          {/* Settings Button */}
          <button
            onClick={() => onCommand('settings')}
            style={{
              padding: '6px 8px',
              border: '1px solid #ccc',
              borderRadius: '4px',
              backgroundColor: 'white',
              cursor: 'pointer',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '2px',
              fontSize: '10px',
              minWidth: '60px',
              flex: 1
            }}
            title="설정"
          >
            <span style={{ fontSize: '14px' }}>⚙️</span>
            <span>설정</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toolbar 