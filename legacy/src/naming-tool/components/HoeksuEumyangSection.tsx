import React from 'react';
import { EumyangHarmonyResult, NameInput } from '../types';
import EumyangSection from './EumyangSection';

interface Props {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

export default function HoeksuEumyangSection(props: Props) {
  return <EumyangSection variant="hoeksu" {...props} />;
}
