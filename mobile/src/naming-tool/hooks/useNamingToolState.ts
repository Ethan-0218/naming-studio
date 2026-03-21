import { useMemo, useState } from 'react';
import { computeNamingAnalysis } from '../domain/analysis';
import {
  CharSlotData,
  Gender,
  HanjaSelection,
  NameInput,
  Ohaeng,
} from '../types';

type SlotKey = 'surname' | 'first1' | 'first2';

interface HangulInput {
  surname: string;
  first1: string;
  first2: string;
}

interface HanjaInput {
  surname: HanjaSelection | null;
  first1: HanjaSelection | null;
  first2: HanjaSelection | null;
}

/** 현재 한글과 선택이 일치할 때만 반환 — 한글이 바뀐 경우 null */
function getValidHanja(
  hangul: string,
  selection: HanjaSelection | null,
): HanjaSelection | null {
  if (!selection || selection.forHangul !== hangul) return null;
  return selection;
}

/** 한글 + 유효한 한자 선택 → 컴포넌트 표시용 CharSlotData */
function resolveSlot(
  hangul: string,
  hanja: HanjaSelection | null,
): CharSlotData {
  return {
    hangul,
    hanja: hanja?.hanja ?? '',
    mean: hanja?.mean ?? '',
    strokeCount: hanja?.strokeCount ?? null,
    charOhaeng: hanja?.charOhaeng ?? null,
    soundEumyang: hanja?.soundEumyang ?? null,
    strokeEumyang: hanja?.strokeEumyang ?? null,
  };
}

export function useNamingToolState(gender: Gender, yongsin: Ohaeng | null) {
  const [hangulInput, setHangulInput] = useState<HangulInput>({
    surname: '',
    first1: '',
    first2: '',
  });
  const [hanjaInput, setHanjaInput] = useState<HanjaInput>({
    surname: null,
    first1: null,
    first2: null,
  });

  const resolvedHanjaInput = useMemo<HanjaInput>(
    () => ({
      surname: getValidHanja(hangulInput.surname, hanjaInput.surname),
      first1: getValidHanja(hangulInput.first1, hanjaInput.first1),
      first2: getValidHanja(hangulInput.first2, hanjaInput.first2),
    }),
    [hangulInput, hanjaInput],
  );

  /** 컴포넌트 표시용 computed view */
  const nameInput: NameInput = useMemo(
    () => ({
      surname: resolveSlot(hangulInput.surname, resolvedHanjaInput.surname),
      first1: resolveSlot(hangulInput.first1, resolvedHanjaInput.first1),
      first2: resolveSlot(hangulInput.first2, resolvedHanjaInput.first2),
    }),
    [hangulInput, resolvedHanjaInput],
  );

  const analysis = useMemo(
    () => computeNamingAnalysis(nameInput, { yongsin }, gender),
    [nameInput, yongsin, gender],
  );

  function updateHangul(slot: SlotKey, hangul: string) {
    setHangulInput((prev) => ({ ...prev, [slot]: hangul }));
  }

  function updateHanja(slot: SlotKey, selection: HanjaSelection) {
    setHanjaInput((prev) => ({ ...prev, [slot]: selection }));
  }

  return {
    nameInput,
    analysis,
    updateHangul,
    updateHanja,
  };
}
