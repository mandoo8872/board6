import React from 'react';
import type { SafeSettings } from '../types';
import { Gear, FolderOpen, Eye, Image, MapPin, Lock, Wrench, CheckSquare } from 'phosphor-react';
import { useSettingsSection } from '../hooks/useSettingsSection';

interface SettingsSectionProps {
  isExpanded: boolean;
  onToggle: () => void;
  safeSettings: SafeSettings;
  updateSettings: (category: 'admin' | 'view', updates: any) => void;
  onImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const SettingsSection: React.FC<SettingsSectionProps> = ({
  isExpanded,
  onToggle,
  safeSettings,
  updateSettings,
  onImageUpload
}) => {
  const {
    passwordChangeMode,
    newPassword,
    confirmPassword,
    setPasswordChangeMode,
    setNewPassword,
    setConfirmPassword,
    handlePasswordChange,
    handlePasswordCancel,
  } = useSettingsSection();
  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200">
      <button
        onClick={onToggle}
        className="w-full p-4 flex items-center justify-between text-sm font-bold text-slate-700 hover:bg-slate-50 rounded-t-xl transition-colors"
      >
        <span className="flex items-center gap-2">
          <Gear size={20} weight="duotone" color="#302929" /> 설정
        </span>
        <span className={`text-slate-400 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}>
          ▼
        </span>
      </button>
      
      {isExpanded && (
        <div className="p-4 border-t border-slate-200 space-y-4">
          
          {/* (구버전) 그리드 설정 블록 제거 - 새 툴바로 이동 */}

          {/* 그리드 편집 모드 섹션 제거됨 (GridManagerSection로 통합) */}

          {/* 객체 생성 위치 */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <MapPin size={16} weight="duotone" color="#302929" /> 객체 생성 위치
            </h4>
            
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">X 좌표</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const x = Math.max(0, safeSettings.admin.objectCreationPosition.x - 20);
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          x
                        }
                      });
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                  >
                    ◀
                  </button>
                  <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                    {safeSettings.admin.objectCreationPosition.x}
                  </span>
                  <button
                    onClick={() => {
                      const x = safeSettings.admin.objectCreationPosition.x + 20;
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          x
                        }
                      });
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                  >
                    ▶
                  </button>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">Y 좌표</label>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => {
                      const y = Math.max(0, safeSettings.admin.objectCreationPosition.y - 20);
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          y
                        }
                      });
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                  >
                    ▲
                  </button>
                  <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                    {safeSettings.admin.objectCreationPosition.y}
                  </span>
                  <button
                    onClick={() => {
                      const y = safeSettings.admin.objectCreationPosition.y + 20;
                      updateSettings('admin', {
                        objectCreationPosition: {
                          ...safeSettings.admin.objectCreationPosition,
                          y
                        }
                      });
                    }}
                    className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                  >
                    ▼
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 배경 이미지 업로드 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-xs font-bold text-slate-600 mb-2 flex items-center gap-1">
              <Image size={16} weight="duotone" color="#302929" /> 배경 이미지
            </h4>
            <label className="w-full px-4 py-2 bg-purple-500 hover:bg-purple-600 text-white rounded-lg transition-colors cursor-pointer text-sm font-medium flex items-center justify-center gap-2">
              <FolderOpen size={18} weight="duotone" color="#FFFFFF" />
              <span>이미지 업로드</span>
              <input
                type="file"
                accept="image/*"
                onChange={onImageUpload}
                className="hidden"
              />
            </label>
          </div>

          {/* 패스워드 변경 */}
          <div className="bg-slate-50 rounded-lg p-3">
            <h4 className="text-xs font-bold text-slate-600 mb-3 flex items-center gap-1">
              <Lock size={16} weight="duotone" color="#302929" /> 패스워드 변경
            </h4>
            
            {passwordChangeMode ? (
              // 패스워드 변경 모드
              <div className="space-y-3">
                <div className="text-xs text-slate-600 font-medium">
                  {passwordChangeMode === 'admin' ? '관리자' : '뷰어'} 패스워드 변경
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">새 패스워드 (4자리 숫자)</label>
                  <input
                    type="password"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    maxLength={4}
                    pattern="\d{4}"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="새 패스워드"
                  />
                </div>
                
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">패스워드 확인</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    maxLength={4}
                    pattern="\d{4}"
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="패스워드 확인"
                  />
                </div>
                
                <div className="flex gap-2">
                  <button
                    onClick={() => handlePasswordChange(passwordChangeMode)}
                    className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    변경
                  </button>
                  <button
                    onClick={handlePasswordCancel}
                    className="flex-1 px-3 py-2 bg-gray-500 hover:bg-gray-600 text-white text-xs font-medium rounded-lg transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              // 패스워드 변경 버튼들
              <div className="space-y-2">
                <button
                  onClick={() => setPasswordChangeMode('admin')}
                  className="w-full px-3 py-2 bg-red-500 hover:bg-red-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <span>👑</span>
                  <span>관리자 패스워드 변경</span>
                </button>
                
                <button
                  onClick={() => setPasswordChangeMode('view')}
                  className="w-full px-3 py-2 bg-green-500 hover:bg-green-600 text-white text-xs font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                >
                  <Eye size={16} weight="duotone" color="#FFFFFF" />
                  <span>뷰어 패스워드 변경</span>
                </button>
              </div>
            )}
          </div>

          {/* 체크박스 기본값 설정 */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-3">
            <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <CheckSquare size={16} weight="duotone" color="#302929" /> 체크박스 기본값
            </h4>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">체크 색상</label>
                <input
                  type="color"
                  value={safeSettings.admin.defaultCheckboxSettings.checkedColor}
                  onChange={(e) => updateSettings('admin', {
                    defaultCheckboxSettings: {
                      ...safeSettings.admin.defaultCheckboxSettings,
                      checkedColor: e.target.value
                    }
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">언체크 색상</label>
                <input
                  type="color"
                  value={safeSettings.admin.defaultCheckboxSettings.uncheckedColor}
                  onChange={(e) => updateSettings('admin', {
                    defaultCheckboxSettings: {
                      ...safeSettings.admin.defaultCheckboxSettings,
                      uncheckedColor: e.target.value
                    }
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">체크 배경색</label>
                <input
                  type="color"
                  value={safeSettings.admin.defaultCheckboxSettings.checkedBackgroundColor}
                  onChange={(e) => updateSettings('admin', {
                    defaultCheckboxSettings: {
                      ...safeSettings.admin.defaultCheckboxSettings,
                      checkedBackgroundColor: e.target.value
                    }
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">언체크 배경색</label>
                <input
                  type="color"
                  value={safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundColor}
                  onChange={(e) => updateSettings('admin', {
                    defaultCheckboxSettings: {
                      ...safeSettings.admin.defaultCheckboxSettings,
                      uncheckedBackgroundColor: e.target.value
                    }
                  })}
                  className="w-full h-8 border rounded"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">체크 배경 투명도</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={1 - safeSettings.admin.defaultCheckboxSettings.checkedBackgroundOpacity}
                    onChange={(e) => updateSettings('admin', {
                      defaultCheckboxSettings: {
                        ...safeSettings.admin.defaultCheckboxSettings,
                        checkedBackgroundOpacity: 1 - Number(e.target.value)
                      }
                    })}
                    className="w-16"
                  />
                  <span className="text-xs w-12 text-right">
                    {Math.round((1 - safeSettings.admin.defaultCheckboxSettings.checkedBackgroundOpacity) * 100)}%
                  </span>
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-slate-600 mb-1 block">언체크 배경 투명도</label>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={1 - safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundOpacity}
                    onChange={(e) => updateSettings('admin', {
                      defaultCheckboxSettings: {
                        ...safeSettings.admin.defaultCheckboxSettings,
                        uncheckedBackgroundOpacity: 1 - Number(e.target.value)
                      }
                    })}
                    className="w-16"
                  />
                  <span className="text-xs w-12 text-right">
                    {Math.round((1 - safeSettings.admin.defaultCheckboxSettings.uncheckedBackgroundOpacity) * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 기타 설정 */}
          <div className="bg-slate-50 rounded-lg p-3 space-y-2">
            <h4 className="text-xs font-bold text-slate-600 flex items-center gap-1">
              <Wrench size={16} weight="duotone" color="#302929" /> 기타
            </h4>
            
            <label className="flex items-center gap-2 text-xs">
              <input 
                type="checkbox" 
                checked={safeSettings.admin.autoToolSwitch}
                onChange={(e) => updateSettings('admin', { autoToolSwitch: e.target.checked })}
                className="rounded" 
              />
              <span>객체 생성 후 자동으로 선택 도구로 전환</span>
            </label>
            
            <div>
              <label className="text-xs font-medium text-slate-600 mb-1 block">기본 폰트 크기</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateSettings('admin', { 
                    defaultFontSize: Math.max(8, safeSettings.admin.defaultFontSize - 2) 
                  })}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                >
                  ▼
                </button>
                <span className="flex-1 text-center text-sm font-mono bg-white py-1 rounded border">
                  {safeSettings.admin.defaultFontSize}px
                </span>
                <button
                  onClick={() => updateSettings('admin', { 
                    defaultFontSize: Math.min(72, safeSettings.admin.defaultFontSize + 2) 
                  })}
                  className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                >
                  ▲
                </button>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-slate-600 mb-2 block">기본 박스 크기</label>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">가로</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSettings('admin', { 
                        defaultBoxWidth: Math.max(50, safeSettings.admin.defaultBoxWidth - 10) 
                      })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                    >
                      ◀
                    </button>
                    <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                      {safeSettings.admin.defaultBoxWidth}px
                    </span>
                    <button
                      onClick={() => updateSettings('admin', { 
                        defaultBoxWidth: Math.min(500, safeSettings.admin.defaultBoxWidth + 10) 
                      })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                    >
                      ▶
                    </button>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-slate-500 mb-1 block">세로</label>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => updateSettings('admin', { 
                        defaultBoxHeight: Math.max(30, safeSettings.admin.defaultBoxHeight - 10) 
                      })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                    >
                      ▲
                    </button>
                    <span className="flex-1 text-center text-xs font-mono bg-white py-1 rounded border">
                      {safeSettings.admin.defaultBoxHeight}px
                    </span>
                    <button
                      onClick={() => updateSettings('admin', { 
                        defaultBoxHeight: Math.min(200, safeSettings.admin.defaultBoxHeight + 10) 
                      })}
                      className="px-2 py-1 bg-white hover:bg-slate-100 rounded text-xs border"
                    >
                      ▼
                    </button>
                  </div>
                </div>
              </div>
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default SettingsSection;
 