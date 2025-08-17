import React, { useState, useRef, useEffect } from 'react';
import NumberKeyboard from './NumberKeyboard';
import { ref, onValue } from 'firebase/database';
import { database } from '../config/firebase';

interface PasswordGateProps {
  passwordKey: 'ADMIN' | 'VIEW';
  onSuccess: () => void;
}

const PasswordGate: React.FC<PasswordGateProps> = ({ passwordKey, onSuccess }) => {
  const [password, setPassword] = useState<string[]>(['', '', '', '']);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const [showKeyboard, setShowKeyboard] = useState(false);
  const [correctPassword, setCorrectPassword] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Firebase에서 직접 패스워드 가져오기
  useEffect(() => {
    const passwordType = passwordKey.toLowerCase() as 'admin' | 'view';
    const passwordRef = ref(database, `settings/admin/passwords/${passwordType}`);
    
    const unsubscribe = onValue(passwordRef, (snapshot) => {
      const dbPassword = snapshot.val();
      if (dbPassword) {
        setCorrectPassword(dbPassword);
        if (import.meta.env.DEV) {
          console.log(`🔑 ${passwordKey} password loaded from DB:`, dbPassword);
        }
      } else {
        // DB에 값이 없으면 기본값 사용
        setCorrectPassword('1004');
        if (import.meta.env.DEV) {
          console.log(`⚠️ ${passwordKey} password not found in DB, using default: 1004`);
        }
      }
      setIsLoading(false);
    }, (error) => {
      console.error(`❌ Failed to load ${passwordKey} password:`, error);
      // 오류 시 기본값 사용
      setCorrectPassword('1004');
      setIsLoading(false);
    });

    return () => unsubscribe();
  }, [passwordKey]);

  // 컴포넌트 마운트 시 첫 번째 입력 칸에 포커스
  useEffect(() => {
    if (inputRefs.current[0]) {
      inputRefs.current[0].focus();
    }
  }, []);

  // 패스워드 검증
  const verifyPassword = (newPassword: string[]) => {
    const enteredPassword = newPassword.join('');
    if (enteredPassword.length === 4) {
      if (isLoading) {
        alert('패스워드를 확인하는 중입니다. 잠시만 기다려주세요.');
        resetPassword();
        return;
      }
      
      if (enteredPassword === correctPassword) {
        onSuccess();
      } else {
        alert('패스워드가 틀렸습니다!');
        resetPassword();
      }
    }
  };

  // 패스워드 초기화
  const resetPassword = () => {
    setPassword(['', '', '', '']);
    setTimeout(() => {
      if (inputRefs.current[0]) {
        inputRefs.current[0].focus();
      }
    }, 100);
  };

  // 입력 처리
  const handleInputChange = (index: number, value: string) => {
    if (value.length > 1) return; // 한 글자만 허용
    
    const newPassword = [...password];
    newPassword[index] = value;
    setPassword(newPassword);

    // 자동 포커스 이동
    if (value && index < 3) {
      setTimeout(() => {
        if (inputRefs.current[index + 1]) {
          inputRefs.current[index + 1]?.focus();
        }
      }, 50);
    }

    // 입력 완료 시 자동 검증
    verifyPassword(newPassword);
  };

  // 키보드 이벤트 처리 (Backspace)
  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !password[index] && index > 0) {
      // 현재 칸이 비어있고 Backspace 누르면 이전 칸으로 이동
      setTimeout(() => {
        if (inputRefs.current[index - 1]) {
          inputRefs.current[index - 1]?.focus();
        }
      }, 50);
    }
  };

  // 가상키보드 키 입력 처리
  const handleVirtualKeyPress = (key: string) => {
    if (key === 'Backspace') {
      // 현재 입력된 마지막 칸 찾기
      let lastFilledIndex = -1;
      for (let i = 3; i >= 0; i--) {
        if (password[i] !== '') {
          lastFilledIndex = i;
          break;
        }
      }
      
      if (lastFilledIndex >= 0) {
        const newPassword = [...password];
        newPassword[lastFilledIndex] = '';
        setPassword(newPassword);
        
        // 해당 input에 포커스
        setTimeout(() => {
          if (inputRefs.current[lastFilledIndex]) {
            inputRefs.current[lastFilledIndex]?.focus();
          }
        }, 50);
      }
    } else if (/^\d$/.test(key)) {
      // 숫자인 경우
      const emptyIndex = password.findIndex(p => p === '');
      if (emptyIndex >= 0) {
        handleInputChange(emptyIndex, key);
      }
    }
  };

  // 입력칸 포커스 시 뷰페이지에서는 키보드 표시
  const handleInputFocus = () => {
    if (passwordKey === 'VIEW') {
      setShowKeyboard(true);
    }
  };

  return (
    <div 
      className="h-screen flex flex-col justify-between items-center p-8"
      style={{ backgroundColor: '#002D72' }} // PANTONE 288C
    >
      {/* 상단 - CI 이미지 */}
      <div className="flex-shrink-0 mt-8 md:mt-16">
        <div className="flex justify-center">
          <img 
            src="/ci.png"
            alt="HYUNDAI GLOVIS"
            className="h-12 sm:h-16 md:h-20 lg:h-24 w-auto max-w-[80vw] object-contain"
            onError={(e) => {
              // CI 이미지 로드 실패 시 텍스트 로고로 대체
              const target = e.target as HTMLImageElement;
              target.style.display = 'none';
              const parent = target.parentElement;
              if (parent) {
                parent.innerHTML = `
                  <div class="relative text-center">
                    <div class="text-white text-sm sm:text-base md:text-lg font-bold tracking-wider leading-none mb-1">
                      HYUNDAI
                    </div>
                    <div class="text-white text-3xl sm:text-4xl md:text-5xl font-bold tracking-wider leading-none ml-8 sm:ml-12 md:ml-16">
                      GLOVIS
                    </div>
                  </div>
                `;
              }
            }}
          />
        </div>
      </div>

      {/* 중앙 - 패스워드 입력 */}
      <div className="flex-grow flex flex-col justify-center items-center">
        <div className="text-white text-lg sm:text-xl md:text-2xl font-bold mb-8 text-center">
          {passwordKey === 'ADMIN' ? '관리자' : '뷰어'} 비밀번호를 입력하세요
        </div>
        
        {isLoading && (
          <div className="text-white text-sm mb-4 opacity-75">
            패스워드 확인 중...
          </div>
        )}
        
        <div className="flex space-x-3 sm:space-x-4 md:space-x-6">
          {password.map((digit, index) => (
                          <input
                key={index}
                ref={(el) => (inputRefs.current[index] = el)}
                type="password"
                value={digit}
                onChange={(e) => handleInputChange(index, e.target.value)}
                onKeyDown={(e) => handleKeyDown(index, e)}
                onFocus={handleInputFocus}
                maxLength={1}
                className="w-10 h-10 sm:w-12 sm:h-12 md:w-14 md:h-14 
                           text-center text-xl sm:text-2xl md:text-3xl font-bold
                           border-2 border-white rounded-lg
                           bg-transparent text-white placeholder-gray-300
                           focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50
                           transition-all duration-200"
                style={{ 
                  color: digit ? 'transparent' : 'white',
                  textShadow: digit ? '0 0 0 white' : 'none',
                  caretColor: 'white'
                }}
              />
          ))}
        </div>
        
        <div className="mt-6 text-white text-sm sm:text-base opacity-80 text-center">
          숫자 4자리를 입력해주세요
        </div>
      </div>

      {/* 하단 - 저작권 */}
      <div className="flex-shrink-0 mb-8">
        <div className="text-white text-xs sm:text-sm opacity-80 text-center font-medium space-y-1">
          <div>© 2025 HYUNDAI GLOVIS. All rights reserved.</div>
          <div className="text-xs opacity-60">
            BOARD7 System v1.0 | Built with React, TypeScript, Tailwind CSS
          </div>
          <div className="text-xs opacity-60">
            Firebase, Zustand, React Router | Open Source Components
          </div>
        </div>
      </div>

      {/* 가상키보드 (VIEW 페이지에서만) */}
      {passwordKey === 'VIEW' && (
        <NumberKeyboard
          isVisible={showKeyboard}
          onKeyPress={handleVirtualKeyPress}
          onClose={() => setShowKeyboard(false)}
        />
      )}
    </div>
  );
};

export default PasswordGate; 