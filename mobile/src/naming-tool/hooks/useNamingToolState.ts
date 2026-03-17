import { useMemo, useState } from 'react';
import {
  HanjaSelection, CharSlotData, Gender, NameInput, NamingAnalysis, SajuInput,
  OhaengHarmonyResult, EumyangHarmonyResult,
} from '../types';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import { computeOhaengHarmony } from '../domain/ohaengHarmony';
import { computeEumyangHarmony } from '../domain/eumyangHarmony';
import { soundEumyangFromHangul } from '../domain/soundEumyangMap';
import { computeSurigyeok } from '../domain/surigyeok';

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
function getValidHanja(hangul: string, selection: HanjaSelection | null): HanjaSelection | null {
  if (!selection || selection.forHangul !== hangul) return null;
  return selection;
}

/** 한글 + 유효한 한자 선택 → 컴포넌트 표시용 CharSlotData */
function resolveSlot(hangul: string, hanja: HanjaSelection | null): CharSlotData {
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

/** Map 수리격 totalScore [-20, 40] → [0, 25] */
function mapSuriScore(rawScore: number): number {
  const clamped = Math.max(-20, Math.min(40, rawScore));
  return Math.round(((clamped + 20) / 60) * 25);
}

function computeAnalysis(
  hangulInput: HangulInput,
  resolvedHanja: HanjaInput,
  sajuInput: SajuInput,
  gender: Gender,
): NamingAnalysis {
  const sH = resolvedHanja.surname;
  const f1H = resolvedHanja.first1;
  const f2H = resolvedHanja.first2;

  // 발음오행: hangul 초성에서 직접 계산
  const baleumElements = [
    hangulInput.surname ? baleumOhaengFromChar(hangulInput.surname) : null,
    hangulInput.first1 ? baleumOhaengFromChar(hangulInput.first1) : null,
    hangulInput.first2 ? baleumOhaengFromChar(hangulInput.first2) : null,
  ];
  const baleumOhaengResult: OhaengHarmonyResult | null = computeOhaengHarmony(baleumElements);

  // 발음음양: 한자 데이터 우선, 없으면 hangul 폴백
  const soundEumyangs = [
    sH?.soundEumyang ?? soundEumyangFromHangul(hangulInput.surname),
    f1H?.soundEumyang ?? soundEumyangFromHangul(hangulInput.first1),
    f2H?.soundEumyang ?? soundEumyangFromHangul(hangulInput.first2),
  ];
  const baleumEumyangResult: EumyangHarmonyResult | null =
    soundEumyangs.some(e => e !== null) ? computeEumyangHarmony(soundEumyangs) : null;

  // 자원오행: 유효한 한자 선택의 charOhaeng
  const jawonElements = [sH?.charOhaeng ?? null, f1H?.charOhaeng ?? null, f2H?.charOhaeng ?? null];
  const jawonOhaengResult: OhaengHarmonyResult | null = computeOhaengHarmony(jawonElements);

  // 획수음양: 유효한 한자 선택의 strokeEumyang
  const strokeEumyangs = [sH?.strokeEumyang ?? null, f1H?.strokeEumyang ?? null, f2H?.strokeEumyang ?? null];
  const hoeksuEumyangResult: EumyangHarmonyResult | null =
    strokeEumyangs.some(e => e !== null) ? computeEumyangHarmony(strokeEumyangs) : null;

  // 수리격: 유효한 한자 선택의 strokeCount
  let surigyeokResult = null;
  if (sH?.strokeCount != null && f1H?.strokeCount != null) {
    surigyeokResult = computeSurigyeok(
      sH.strokeCount,
      f1H.strokeCount,
      f2H?.strokeCount ?? null,
      gender,
    );
  }

  // 종합 점수
  let totalScore: number | null = null;
  if (baleumOhaengResult || baleumEumyangResult || surigyeokResult || jawonOhaengResult || hoeksuEumyangResult) {
    let score = 0;
    if (baleumOhaengResult) {
      score += baleumOhaengResult.level === '대길' ? 25 : baleumOhaengResult.level === '반길' ? 15 : 0;
    }
    if (baleumEumyangResult) {
      score += baleumEumyangResult.harmonious ? 15 : 5;
    }
    if (surigyeokResult) {
      score += mapSuriScore(surigyeokResult.totalScore);
    }
    if (jawonOhaengResult) {
      score += jawonOhaengResult.level === '대길' ? 25 : jawonOhaengResult.level === '반길' ? 15 : 0;
    }
    if (hoeksuEumyangResult) {
      score += hoeksuEumyangResult.harmonious ? 10 : 0;
    }
    totalScore = Math.min(100, score);
  }

  return {
    baleumOhaeng: baleumOhaengResult,
    baleumEumyang: baleumEumyangResult,
    surigyeok: surigyeokResult,
    jawonOhaeng: jawonOhaengResult,
    hoeksuEumyang: hoeksuEumyangResult,
    totalScore,
  };
}

export function useNamingToolState() {
  const [hangulInput, setHangulInput] = useState<HangulInput>({ surname: '', first1: '', first2: '' });
  const [hanjaInput, setHanjaInput] = useState<HanjaInput>({ surname: null, first1: null, first2: null });
  const [sajuInput, setSajuInput] = useState<SajuInput>({ yongsin: null });
  const [gender, setGender] = useState<Gender>('male');

  const resolvedHanjaInput = useMemo<HanjaInput>(() => ({
    surname: getValidHanja(hangulInput.surname, hanjaInput.surname),
    first1: getValidHanja(hangulInput.first1, hanjaInput.first1),
    first2: getValidHanja(hangulInput.first2, hanjaInput.first2),
  }), [hangulInput, hanjaInput]);

  /** 컴포넌트 표시용 computed view */
  const nameInput: NameInput = useMemo(() => ({
    surname: resolveSlot(hangulInput.surname, resolvedHanjaInput.surname),
    first1: resolveSlot(hangulInput.first1, resolvedHanjaInput.first1),
    first2: resolveSlot(hangulInput.first2, resolvedHanjaInput.first2),
  }), [hangulInput, resolvedHanjaInput]);

  const analysis = useMemo(
    () => computeAnalysis(hangulInput, resolvedHanjaInput, sajuInput, gender),
    [hangulInput, resolvedHanjaInput, sajuInput, gender],
  );

  function updateHangul(slot: SlotKey, hangul: string) {
    setHangulInput(prev => ({ ...prev, [slot]: hangul }));
  }

  function updateHanja(slot: SlotKey, selection: HanjaSelection) {
    setHanjaInput(prev => ({ ...prev, [slot]: selection }));
  }

  function updateSaju(data: Partial<SajuInput>) {
    setSajuInput(prev => ({ ...prev, ...data }));
  }

  return {
    nameInput, sajuInput, gender, setGender,
    analysis, updateHangul, updateHanja, updateSaju,
  };
}
