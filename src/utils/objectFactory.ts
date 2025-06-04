import { v4 as uuidv4 } from 'uuid'
import { TextBox } from '../types'

export const createTextBox = (
  x: number,
  y: number,
  content: string = '새 텍스트'
): TextBox => {
  return {
    id: uuidv4(),
    type: 'text',
    x,
    y,
    width: 150,
    height: 60,
    content,
    backgroundColor: '#888888',
    opacity: 0.5,
    textAlign: 'left',
    verticalAlign: 'top',
    meta: {
      isMovable: true,
      isDeletable: true,
      isResizable: true,
      isErasable: false
    }
  }
} 