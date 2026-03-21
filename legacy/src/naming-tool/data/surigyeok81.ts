import { SuriLevel } from '../types';
import rawData from '@shared/data/수리격.json';

export interface SurigyeokEntry {
  level: { male: SuriLevel; female: SuriLevel };
  name1: string;
  name2: string;
  interpretation: string;
  easyInterpretation: string;
}

export const SURIGYEOK_81 = rawData as Record<string, SurigyeokEntry>;
