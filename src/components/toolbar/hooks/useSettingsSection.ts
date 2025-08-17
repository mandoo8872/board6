import { useState } from 'react';
import { useAdminConfigStore } from '../../../store';

export const useSettingsSection = () => {
  const { updatePassword } = useAdminConfigStore();

  const [passwordChangeMode, setPasswordChangeMode] = useState<'admin' | 'view' | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordChange = async (type: 'admin' | 'view') => {
    if (newPassword.length !== 4 || !/^\d{4}$/.test(newPassword)) {
      alert('패스워드는 4자리 숫자여야 합니다.');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('패스워드 확인이 일치하지 않습니다.');
      return;
    }
    try {
      await updatePassword(type, newPassword);
      alert(`${type === 'admin' ? '관리자' : '뷰어'} 패스워드가 성공적으로 변경되었습니다.`);
      setPasswordChangeMode(null);
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      alert(`패스워드 변경 실패: ${error?.message || '알 수 없는 오류'}`);
    }
  };

  const handlePasswordCancel = () => {
    setPasswordChangeMode(null);
    setNewPassword('');
    setConfirmPassword('');
  };

  return {
    passwordChangeMode,
    newPassword,
    confirmPassword,
    setPasswordChangeMode,
    setNewPassword,
    setConfirmPassword,
    handlePasswordChange,
    handlePasswordCancel,
  };
};


