import React from 'react';
import { EumyangHarmonyResult, NameInput } from '@/naming-tool/types';
import EumyangSection from './EumyangSection';

interface Props {
  nameInput: NameInput;
  result: EumyangHarmonyResult | null;
}

function BaleumEumyangSection(props: Props) {
  return <EumyangSection variant="baleum" {...props} />;
}

export default React.memo(BaleumEumyangSection);
