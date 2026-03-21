import {
  Gender,
  NameInput,
  NamingAnalysis,
  OhaengHarmonyResult,
  EumyangHarmonyResult,
  SajuInput,
} from '../types';
import { baleumOhaengFromChar } from './baleumOhaeng';
import { computeOhaengHarmony } from './ohaengHarmony';
import { computeEumyangHarmony } from './eumyangHarmony';
import { soundEumyangFromHangul } from './soundEumyangMap';
import { computeSurigyeok } from './surigyeok';
import { toScore } from './ratingScore';
import { computeSajuComplementLevel } from './sajuComplementLevel';
import rawWeights from '@shared/data/scoring_weights.json';

// 전통 5항 원래 가중치 합 = 0.60, 사주보완 = 0.40 → 총 1.0
const W_TOTAL =
  rawWeights.jawonOhaeng +
  rawWeights.baleumOhaeng +
  rawWeights.surigyeok +
  rawWeights.baleumEumyang +
  rawWeights.hoeksuEumyang;
const W_SAJU = 0.4;

// 원래 가중치(raw) 사용: 합산 시 0~0.60 스케일, 비율은 ohaengScore/eumyangScore 계산에서 그대로 유지됨
const W = {
  jawonOhaeng: rawWeights.jawonOhaeng,
  baleumOhaeng: rawWeights.baleumOhaeng,
  surigyeok: rawWeights.surigyeok,
  baleumEumyang: rawWeights.baleumEumyang,
  hoeksuEumyang: rawWeights.hoeksuEumyang,
};

/**
 * NameInput(CharSlotData 형태)와 SajuInput, gender를 받아 NamingAnalysis를 계산합니다.
 * SelfNaming(useNamingToolState)과 NameDetailScreen 모두에서 사용됩니다.
 */
export function computeNamingAnalysis(
  nameInput: NameInput,
  sajuInput: SajuInput,
  gender: Gender,
): NamingAnalysis {
  const { surname, first1, first2 } = nameInput;

  const baleumElements = [
    surname.hangul ? baleumOhaengFromChar(surname.hangul) : null,
    first1.hangul ? baleumOhaengFromChar(first1.hangul) : null,
    first2.hangul ? baleumOhaengFromChar(first2.hangul) : null,
  ];
  const baleumOhaengResult: OhaengHarmonyResult | null =
    computeOhaengHarmony(baleumElements);

  const soundEumyangs = [
    surname.soundEumyang ?? soundEumyangFromHangul(surname.hangul),
    first1.soundEumyang ?? soundEumyangFromHangul(first1.hangul),
    first2.soundEumyang ?? soundEumyangFromHangul(first2.hangul),
  ];
  const baleumEumyangResult: EumyangHarmonyResult | null = soundEumyangs.some(
    (e) => e !== null,
  )
    ? computeEumyangHarmony(soundEumyangs)
    : null;

  const jawonElements = [
    surname.charOhaeng,
    first1.charOhaeng,
    first2.charOhaeng,
  ];
  const jawonOhaengResult: OhaengHarmonyResult | null =
    computeOhaengHarmony(jawonElements);

  const strokeEumyangs = [
    surname.strokeEumyang,
    first1.strokeEumyang,
    first2.strokeEumyang,
  ];
  const hoeksuEumyangResult: EumyangHarmonyResult | null = strokeEumyangs.some(
    (e) => e !== null,
  )
    ? computeEumyangHarmony(strokeEumyangs)
    : null;

  let surigyeokResult = null;
  if (surname.strokeCount != null && first1.strokeCount != null) {
    surigyeokResult = computeSurigyeok(
      surname.strokeCount,
      first1.strokeCount,
      first2.strokeCount,
      gender,
    );
  }

  let totalScore: number | null = null;
  let ohaengScore: number | null = null;
  let suriScore: number | null = null;
  let eumyangScore: number | null = null;

  const sajuComplementLevel =
    sajuInput.yongsin != null
      ? computeSajuComplementLevel(sajuInput.yongsin, jawonElements)
      : null;
  const sajuComplementScore =
    sajuComplementLevel != null
      ? Math.round(toScore(sajuComplementLevel) * 100)
      : null;

  const hasAny =
    baleumOhaengResult ||
    baleumEumyangResult ||
    surigyeokResult ||
    jawonOhaengResult ||
    hoeksuEumyangResult;

  if (hasAny) {
    let rawScore = 0;
    if (baleumOhaengResult)
      rawScore += toScore(baleumOhaengResult.level) * W.baleumOhaeng;
    if (baleumEumyangResult)
      rawScore += toScore(baleumEumyangResult.rating) * W.baleumEumyang;
    if (surigyeokResult) rawScore += surigyeokResult.totalScore * W.surigyeok;
    if (jawonOhaengResult)
      rawScore += toScore(jawonOhaengResult.level) * W.jawonOhaeng;
    if (hoeksuEumyangResult)
      rawScore += toScore(hoeksuEumyangResult.rating) * W.hoeksuEumyang;

    // 사주보완(용신) 있으면 백엔드와 동일하게 0.40 가중 합산 → 0~1.0 × 100
    // 없으면 전통 5항만 W_TOTAL(0.60)로 정규화 → 0~100
    if (sajuComplementLevel != null) {
      const sajuScore = toScore(sajuComplementLevel);
      totalScore = Math.round(
        Math.min(100, (rawScore + sajuScore * W_SAJU) * 100),
      );
    } else {
      totalScore = Math.round(Math.min(100, (rawScore / W_TOTAL) * 100));
    }

    if (baleumOhaengResult && jawonOhaengResult) {
      ohaengScore = Math.round(
        ((toScore(baleumOhaengResult.level) * W.baleumOhaeng +
          toScore(jawonOhaengResult.level) * W.jawonOhaeng) /
          (W.baleumOhaeng + W.jawonOhaeng)) *
          100,
      );
    } else if (baleumOhaengResult) {
      ohaengScore = Math.round(toScore(baleumOhaengResult.level) * 100);
    } else if (jawonOhaengResult) {
      ohaengScore = Math.round(toScore(jawonOhaengResult.level) * 100);
    }

    if (surigyeokResult) {
      suriScore = Math.round(surigyeokResult.totalScore * 100);
    }

    if (baleumEumyangResult && hoeksuEumyangResult) {
      eumyangScore = Math.round(
        ((toScore(baleumEumyangResult.rating) * W.baleumEumyang +
          toScore(hoeksuEumyangResult.rating) * W.hoeksuEumyang) /
          (W.baleumEumyang + W.hoeksuEumyang)) *
          100,
      );
    } else if (baleumEumyangResult) {
      eumyangScore = Math.round(toScore(baleumEumyangResult.rating) * 100);
    } else if (hoeksuEumyangResult) {
      eumyangScore = Math.round(toScore(hoeksuEumyangResult.rating) * 100);
    }
  }

  return {
    baleumOhaeng: baleumOhaengResult,
    baleumEumyang: baleumEumyangResult,
    surigyeok: surigyeokResult,
    jawonOhaeng: jawonOhaengResult,
    hoeksuEumyang: hoeksuEumyangResult,
    totalScore,
    ohaengScore,
    suriScore,
    eumyangScore,
    sajuComplementLevel,
    sajuComplementScore,
  };
}
