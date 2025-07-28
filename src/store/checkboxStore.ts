import { create } from 'zustand';

export interface CheckboxStore {
  defaultCheckedColor: string;
  defaultUncheckedColor: string;
  // 체크 상태에 따른 배경 변경 설정
  checkedBackgroundColor: string;
  uncheckedBackgroundColor: string;
  checkedBackgroundOpacity: number;
  uncheckedBackgroundOpacity: number;
  
  setDefaultCheckedColor: (color: string) => void;
  setDefaultUncheckedColor: (color: string) => void;
  setCheckedBackgroundColor: (color: string) => void;
  setUncheckedBackgroundColor: (color: string) => void;
  setCheckedBackgroundOpacity: (opacity: number) => void;
  setUncheckedBackgroundOpacity: (opacity: number) => void;
}

export const useCheckboxStore = create<CheckboxStore>((set) => ({
  defaultCheckedColor: '#10b981', // 기본 체크된 색상 (green-500)
  defaultUncheckedColor: '#f3f4f6', // 기본 체크 안된 색상 (gray-100)
  
  // 체크 상태에 따른 배경 설정
  checkedBackgroundColor: '#dcfce7', // 연한 초록색
  uncheckedBackgroundColor: '#ffffff', // 흰색
  checkedBackgroundOpacity: 0.8,
  uncheckedBackgroundOpacity: 1.0,
  
  setDefaultCheckedColor: (color) => set({ defaultCheckedColor: color }),
  setDefaultUncheckedColor: (color) => set({ defaultUncheckedColor: color }),
  setCheckedBackgroundColor: (color) => set({ checkedBackgroundColor: color }),
  setUncheckedBackgroundColor: (color) => set({ uncheckedBackgroundColor: color }),
  setCheckedBackgroundOpacity: (opacity) => set({ checkedBackgroundOpacity: opacity }),
  setUncheckedBackgroundOpacity: (opacity) => set({ uncheckedBackgroundOpacity: opacity }),
})); 