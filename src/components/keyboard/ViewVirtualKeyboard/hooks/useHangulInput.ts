import { useState, useCallback } from 'react';
import { 
  assembleHangul, 
  isConsonant, 
  isVowel, 
  canCombineVowels, 
  canCombineConsonants
} from '../utils/hangulUtils';

interface HangulState {
  initial: string;
  middle: string;
  final: string;
  isAssembling: boolean;
}

export const useHangulInput = () => {
  const [hangulState, setHangulState] = useState<HangulState>({
    initial: '',
    middle: '',
    final: '',
    isAssembling: false
  });

  const processKoreanInput = useCallback((key: string, currentText: string): string => {
    if (isConsonant(key)) {
      return processConsonantInput(key, currentText);
    } else if (isVowel(key)) {
      return processVowelInput(key, currentText);
    } else {
      // 숫자나 특수문자 - 조립 상태 초기화
      resetHangulState();
      return currentText + key;
    }
  }, [hangulState]);

  const processConsonantInput = useCallback((consonant: string, currentText: string): string => {
    if (!hangulState.isAssembling) {
      // 새로운 한글 조립 시작
      setHangulState({
        initial: consonant,
        middle: '',
        final: '',
        isAssembling: true
      });
      return currentText + consonant;
    }

    // 이미 조립 중인 경우
    if (hangulState.initial && hangulState.middle && !hangulState.final) {
      // 종성 위치에 자음 추가
      setHangulState(prev => ({
        ...prev,
        final: consonant
      }));
      const assembled = assembleHangul(hangulState.initial, hangulState.middle, consonant);
      if (assembled) {
        return currentText.slice(0, -1) + assembled;
      }
      return currentText + consonant;
    }

    if (hangulState.initial && hangulState.middle && hangulState.final) {
      // 종성이 있는 상태에서 새 자음 - 복합 종성 시도
      const compoundFinal = canCombineConsonants(hangulState.final, consonant);
      if (compoundFinal) {
        setHangulState(prev => ({
          ...prev,
          final: compoundFinal
        }));
        const assembled = assembleHangul(hangulState.initial, hangulState.middle, compoundFinal);
        if (assembled) {
          return currentText.slice(0, -1) + assembled;
        }
      } else {
        // 복합 종성 불가능 - 현재 글자 완성하고 새 글자 시작
        const currentAssembled = assembleHangul(hangulState.initial, hangulState.middle, hangulState.final);
        setHangulState({
          initial: consonant,
          middle: '',
          final: '',
          isAssembling: true
        });
        return currentText.slice(0, -1) + currentAssembled + consonant;
      }
    }

    // 초성만 있거나 중성이 없는 경우 - 현재 글자 완성하고 새 글자 시작
    let result = currentText;
    if (hangulState.initial && hangulState.middle) {
      const assembled = assembleHangul(hangulState.initial, hangulState.middle);
      if (assembled) {
        result = currentText.slice(0, -1) + assembled;
      }
    }

    setHangulState({
      initial: consonant,
      middle: '',
      final: '',
      isAssembling: true
    });

    return result + consonant;
  }, [hangulState]);

  const processVowelInput = useCallback((vowel: string, currentText: string): string => {
    if (hangulState.isAssembling && hangulState.initial && !hangulState.middle) {
      // 초성 다음에 중성 추가
      setHangulState(prev => ({
        ...prev,
        middle: vowel
      }));
      const assembled = assembleHangul(hangulState.initial, vowel);
      if (assembled) {
        return currentText.slice(0, -1) + assembled;
      }
      return currentText + vowel;
    }

    if (hangulState.initial && hangulState.middle && !hangulState.final) {
      // 중성이 있는 상태에서 새 모음 - 복합 모음 시도
      const compoundMiddle = canCombineVowels(hangulState.middle, vowel);
      if (compoundMiddle) {
        setHangulState(prev => ({
          ...prev,
          middle: compoundMiddle
        }));
        const assembled = assembleHangul(hangulState.initial, compoundMiddle);
        if (assembled) {
          return currentText.slice(0, -1) + assembled;
        }
      } else {
        // 복합 모음 불가능 - 현재 글자 완성하고 새 글자 시작 (모음은 단독 불가)
        const assembled = assembleHangul(hangulState.initial, hangulState.middle);
        resetHangulState();
        return currentText.slice(0, -1) + assembled + vowel;
      }
    }

    if (hangulState.initial && hangulState.middle && hangulState.final) {
      // 종성이 있는 완성된 글자 다음에 모음 - 종성을 초성으로 분리
      const lastConsonant = hangulState.final;
      const assembledWithoutFinal = assembleHangul(hangulState.initial, hangulState.middle);
      
      setHangulState({
        initial: lastConsonant,
        middle: vowel,
        final: '',
        isAssembling: true
      });

      const newAssembled = assembleHangul(lastConsonant, vowel);
      if (assembledWithoutFinal && newAssembled) {
        return currentText.slice(0, -1) + assembledWithoutFinal + newAssembled;
      }
    }

    // 단독 모음이나 조립 불가능한 상황
    resetHangulState();
    return currentText + vowel;
  }, [hangulState]);

  const processBackspace = useCallback((currentText: string): string => {
    if (!hangulState.isAssembling || currentText.length === 0) {
      // 조립 중이 아니거나 텍스트가 비어있으면 단순 삭제
      resetHangulState();
      return currentText.slice(0, -1);
    }

    // 한글 조립 중인 경우 - 단계별 분해
    if (hangulState.final) {
      // 종성 제거
      setHangulState(prev => ({
        ...prev,
        final: ''
      }));
      const assembled = assembleHangul(hangulState.initial, hangulState.middle);
      if (assembled) {
        return currentText.slice(0, -1) + assembled;
      }
    } else if (hangulState.middle) {
      // 중성 제거
      setHangulState(prev => ({
        ...prev,
        middle: ''
      }));
      return currentText.slice(0, -1) + hangulState.initial;
    } else if (hangulState.initial) {
      // 초성 제거 - 조립 상태 초기화
      resetHangulState();
      return currentText.slice(0, -1);
    }

    return currentText.slice(0, -1);
  }, [hangulState]);

  const resetHangulState = useCallback(() => {
    setHangulState({
      initial: '',
      middle: '',
      final: '',
      isAssembling: false
    });
  }, []);

  const finalizeCurrentChar = useCallback((currentText: string): string => {
    if (hangulState.isAssembling && hangulState.initial && hangulState.middle) {
      const assembled = assembleHangul(hangulState.initial, hangulState.middle, hangulState.final);
      if (assembled) {
        resetHangulState();
        return currentText.slice(0, -1) + assembled;
      }
    }
    resetHangulState();
    return currentText;
  }, [hangulState]);

  return {
    hangulState,
    processKoreanInput,
    processBackspace,
    resetHangulState,
    finalizeCurrentChar
  };
};