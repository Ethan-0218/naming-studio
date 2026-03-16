import { useFonts as useExpoFonts } from 'expo-font';

// v0.4.x subpath import — 사용하는 weight만 번들에 포함됨
import { NotoSerifKR_300Light }   from '@expo-google-fonts/noto-serif-kr/300Light';
import { NotoSerifKR_400Regular } from '@expo-google-fonts/noto-serif-kr/400Regular';
import { NotoSerifKR_500Medium }  from '@expo-google-fonts/noto-serif-kr/500Medium';
import { NotoSerifKR_600SemiBold } from '@expo-google-fonts/noto-serif-kr/600SemiBold';

import { NotoSansKR_300Light }   from '@expo-google-fonts/noto-sans-kr/300Light';
import { NotoSansKR_400Regular } from '@expo-google-fonts/noto-sans-kr/400Regular';
import { NotoSansKR_500Medium }  from '@expo-google-fonts/noto-sans-kr/500Medium';

/**
 * 앱에서 사용하는 모든 폰트를 로드하는 훅.
 * 루트 컴포넌트에서 한 번만 호출한다.
 *
 * @returns [fontsLoaded, error]
 * - fontsLoaded: 모든 폰트 로드 완료 여부
 * - error: 로드 실패 시 오류 (null이면 정상)
 */
export function useAppFonts(): [boolean, Error | null] {
  return useExpoFonts({
    NotoSerifKR_300Light,
    NotoSerifKR_400Regular,
    NotoSerifKR_500Medium,
    NotoSerifKR_600SemiBold,
    NotoSansKR_300Light,
    NotoSansKR_400Regular,
    NotoSansKR_500Medium,
  });
}
