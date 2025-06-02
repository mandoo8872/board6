import React, { useState } from 'react'
import { DrawingTool, CommandTool } from '../types'

interface ToolbarProps {
  currentTool: DrawingTool
  onToolChange: (tool: DrawingTool) => void
  onCommand: (command: CommandTool) => void
  gridSize?: number
  onGridSizeChange?: (size: number) => void
}

const Toolbar: React.FC<ToolbarProps> = ({
  currentTool,
  onToolChange,
  onCommand,
  gridSize,
  onGridSizeChange
}) => {
  const [showGridDropdown, setShowGridDropdown] = useState(false)
  
  const gridSizeOptions = [16, 40, 64, 100, 128]

  const drawingTools: { command: DrawingTool; label: string; icon: string }[] = [
    { command: 'select', label: '선택', icon: '👆' },
    { command: 'pen', label: '펜', icon: '✏️' },
    { command: 'eraser', label: '지우개', icon: '🧹' },
    { command: 'rect', label: '사각형', icon: '⬜' }
  ]

  const commandToolsRow1: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'undo', label: '실행취소', icon: '↩️' },
    { command: 'redo', label: '다시실행', icon: '↪️' },
    { command: 'image', label: '이미지', icon: '🖼️' }
  ];
  const commandToolsRow2: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'save', label: '저장', icon: '💾' },
    { command: 'load', label: '불러오기', icon: '📁' },
    { command: 'settings', label: '설정', icon: '⚙️' }
  ];
  const commandToolsRow3: { command: CommandTool; label: string; icon: string }[] = [
    { command: 'push', label: 'Push', icon: '📤' },
    { command: 'pull', label: 'Pull', icon: '📥' }
  ];

  return (
    <div style={{
      position: 'absolute',
      top: '24px',
      left: '24px',
      zIndex: 1000,
      display: 'flex',
      flexDirection: 'column',
      gap: '28px',
      backgroundColor: 'white',
      padding: '24px',
      borderRadius: '16px',
      boxShadow: '0 4px 16px rgba(0,0,0,0.10)',
      border: '1px solid #e0e0e0',
      maxWidth: '280px',
      minWidth: '210px',
      alignItems: 'stretch'
    }}>
      {/* 그리기 도구 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <div style={{ fontSize: '15px', fontWeight: 700, color: '#555', marginBottom: '2px' }}>그리기 도구</div>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
          {drawingTools.map(({ command, label, icon }) => (
            <button
              key={command}
              onClick={() => onToolChange(command)}
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
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-start' }}>
            {commandToolsRow3.map(({ command, label, icon }) => (
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
          {/* 설정 버튼 */}
          <button
            onClick={() => onCommand('settings')}
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
            title="설정"
          >
            <span style={{ fontSize: '22px' }}>⚙️</span>
            <span>설정</span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default Toolbar 