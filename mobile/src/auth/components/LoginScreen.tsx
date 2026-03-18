import * as AppleAuthentication from 'expo-apple-authentication';
import React, { useContext } from 'react';
import { Alert, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { AuthContext } from '../AuthContext';
import { signInWithApple } from '../api';
import { useAppleAuth } from '../hooks/useAppleAuth';

export default function LoginScreen() {
  const { setAuth } = useContext(AuthContext);
  const { isAvailable, signIn } = useAppleAuth();

  async function handleAppleSignIn() {
    try {
      const { identityToken, fullName, email } = await signIn();
      const { access_token, user_id, profile } = await signInWithApple(
        identityToken,
        fullName,
        email,
      );
      await setAuth(access_token, user_id, profile);
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('오류', 'Apple 로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }

  return (
    <SafeAreaView
      style={{
        flex: 1,
        backgroundColor: colors.bg,
        justifyContent: 'center',
        alignItems: 'center',
        gap: 48,
      }}
    >
      <View style={{ alignItems: 'center', gap: 8 }}>
        <Font
          tag="primaryMedium"
          style={{ fontSize: 28, letterSpacing: 4, color: colors.textPrimary }}
        >
          명주 스튜디오
        </Font>
        <Font
          tag="secondary"
          style={{
            fontSize: 12,
            letterSpacing: 1.5,
            color: colors.textTertiary,
          }}
        >
          命主 · 이름의 시작
        </Font>
      </View>

      {isAvailable && (
        <AppleAuthentication.AppleAuthenticationButton
          buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
          buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
          cornerRadius={8}
          style={{ width: 240, height: 48 }}
          onPress={handleAppleSignIn}
        />
      )}
    </SafeAreaView>
  );
}
