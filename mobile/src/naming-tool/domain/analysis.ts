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

const W_TOTAL =
  rawWeights.jawonOhaeng +
  rawWeights.baleumOhaeng +
  rawWeights.surigyeok +
  rawWeights.baleumEumyang +
  rawWeights.hoeksuEumyang;

const W = {
  jawonOhaeng: Math.round((rawWeights.jawonOhaeng / W_TOTAL) * 100),
  baleumOhaeng: Math.round((rawWeights.baleumOhaeng / W_TOTAL) * 100),
  surigyeok: Math.round((rawWeights.surigyeok / W_TOTAL) * 100),
  baleumEumyang: Math.round((rawWeights.baleumEumyang / W_TOTAL) * 100),
  hoeksuEumyang: Math.round((rawWeights.hoeksuEumyang / W_TOTAL) * 100),
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
    let score = 0;
    if (baleumOhaengResult)
      score += toScore(baleumOhaengResult.level) * W.baleumOhaeng;
    if (baleumEumyangResult)
      score += toScore(baleumEumyangResult.rating) * W.baleumEumyang;
    if (surigyeokResult) score += surigyeokResult.totalScore * W.surigyeok;
    if (jawonOhaengResult)
      score += toScore(jawonOhaengResult.level) * W.jawonOhaeng;
    if (hoeksuEumyangResult)
      score += toScore(hoeksuEumyangResult.rating) * W.hoeksuEumyang;
    totalScore = Math.round(Math.min(100, score));

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
