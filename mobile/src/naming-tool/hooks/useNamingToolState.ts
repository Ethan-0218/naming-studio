import { useMemo, useState } from 'react';
import {
  CharSlotData, Gender, NameInput, NamingAnalysis, SajuInput,
  OhaengHarmonyResult, EumyangHarmonyResult,
} from '../types';
import { baleumOhaengFromChar } from '../domain/baleumOhaeng';
import { computeOhaengHarmony } from '../domain/ohaengHarmony';
import { computeEumyangHarmony } from '../domain/eumyangHarmony';
import { computeSurigyeok } from '../domain/surigyeok';

function emptySlot(): CharSlotData {
  return {
    hangul: '', hanja: '', mean: '',
    strokeCount: null, charOhaeng: null,
    baleumOhaeng: null, soundEumyang: null, strokeEumyang: null,
  };
}

function emptyNameInput(): NameInput {
  return { surname: emptySlot(), first1: emptySlot(), first2: emptySlot() };
}

function emptySajuInput(): SajuInput {
  return { yongsin: null };
}

/** Map 수리격 totalScore [-20, 40] → [0, 25] */
function mapSuriScore(rawScore: number): number {
  const clamped = Math.max(-20, Math.min(40, rawScore));
  return Math.round(((clamped + 20) / 60) * 25);
}

function computeAnalysis(
  nameInput: NameInput,
  sajuInput: SajuInput,
  gender: Gender,
): NamingAnalysis {
  const { surname, first1, first2 } = nameInput;

  // 발음오행: derived from hangul characters' initial consonants
  const baleumElements = [
    surname.hangul ? baleumOhaengFromChar(surname.hangul) : null,
    first1.hangul ? baleumOhaengFromChar(first1.hangul) : null,
    first2.hangul ? baleumOhaengFromChar(first2.hangul) : null,
  ];
  const baleumOhaengResult: OhaengHarmonyResult | null = computeOhaengHarmony(baleumElements);

  // 발음음양: from API sound_based_yin_yang
  const soundEumyangs = [surname.soundEumyang, first1.soundEumyang, first2.soundEumyang];
  const baleumEumyangResult: EumyangHarmonyResult | null =
    soundEumyangs.some(e => e !== null) ? computeEumyangHarmony(soundEumyangs) : null;

  // 자원오행: from hanja char_ohaeng
  const jawonElements = [surname.charOhaeng, first1.charOhaeng, first2.charOhaeng];
  const jawonOhaengResult: OhaengHarmonyResult | null = computeOhaengHarmony(jawonElements);

  // 획수음양: from stroke count parity (odd=양, even=음)
  const strokeEumyangs = [surname.strokeEumyang, first1.strokeEumyang, first2.strokeEumyang];
  const hoeksuEumyangResult: EumyangHarmonyResult | null =
    strokeEumyangs.some(e => e !== null) ? computeEumyangHarmony(strokeEumyangs) : null;

  // 수리격
  let surigyeokResult = null;
  if (surname.strokeCount != null && first1.strokeCount != null) {
    surigyeokResult = computeSurigyeok(
      surname.strokeCount,
      first1.strokeCount,
      first2.strokeCount,
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
  const [nameInput, setNameInput] = useState<NameInput>(emptyNameInput);
  const [sajuInput, setSajuInput] = useState<SajuInput>(emptySajuInput);
  const [gender, setGender] = useState<Gender>('male');

  const analysis = useMemo(
    () => computeAnalysis(nameInput, sajuInput, gender),
    [nameInput, sajuInput, gender],
  );

  function updateSlot(slot: 'surname' | 'first1' | 'first2', data: Partial<CharSlotData>) {
    setNameInput(prev => ({ ...prev, [slot]: { ...prev[slot], ...data } }));
  }

  function updateSaju(data: Partial<SajuInput>) {
    setSajuInput(prev => ({ ...prev, ...data }));
  }

  return {
    nameInput, sajuInput, gender, setGender,
    analysis, updateSlot, updateSaju,
  };
}
