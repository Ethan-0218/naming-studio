import React from 'react';
import { EumyangHarmonyResult, NameInput } from '@/naming-tool/types';
import EumyangSection from './EumyangSection';

interface Props {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

export default function BaleumEumyangSection(props: Props) {
  return <EumyangSection variant="baleum" {...props} />;
}
