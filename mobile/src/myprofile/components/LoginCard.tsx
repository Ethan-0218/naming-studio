import * as AppleAuthentication from 'expo-apple-authentication';
import React from 'react';
import { Alert, Pressable, View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { useAuth } from '@/auth/AuthContext';
import { signInWithApple } from '@/auth/api';
import { useAppleAuth } from '@/auth/hooks/useAppleAuth';

export default function LoginCard() {
  const { setAuth } = useAuth();
  const { isAvailable, signIn } = useAppleAuth();

  async function handleAppleSignIn() {
    try {
      const { identityToken, fullName, email } = await signIn();
      const { access_token, user_id, profile } = await signInWithApple(identityToken, fullName, email);
      await setAuth(access_token, user_id, profile);
    } catch (error: any) {
      if (error?.code === 'ERR_REQUEST_CANCELED') return;
      Alert.alert('오류', 'Apple 로그인에 실패했습니다. 다시 시도해 주세요.');
    }
  }

  function handleKakaoSignIn() {
    Alert.alert('알림', '카카오 로그인은 준비 중입니다.');
  }

  function handleGoogleSignIn() {
    Alert.alert('알림', 'Google 로그인은 준비 중입니다.');
  }

  return (
    <View className="m-4 mb-0">
      <View className="bg-surfaceRaised rounded-xl border border-border p-5 pt-[30px] pb-[22px] items-center">
        {/* 名 Logo */}
        <View className="w-[54px] h-[54px] rounded-[16px] bg-fillBold items-center justify-center mb-[14px]">
          <Font tag="primaryMedium" style={{ fontSize: 26, color: colors.textInverse }}>
            名
          </Font>
        </View>

        <Font tag="primaryMedium" className="mb-[7px]" style={{ fontSize: 17, color: colors.textPrimary, letterSpacing: 0.5, textAlign: 'center' }}>
          이름공방에 오신 걸 환영합니다
        </Font>
        <Font tag="secondary" className="mb-[22px]" style={{ fontSize: 12.5, color: colors.textTertiary, textAlign: 'center', lineHeight: 20, letterSpacing: 0.2 }}>
          {'로그인하고 명주를 관리하며\n이름 분석을 시작하세요'}
        </Font>

        {/* 카카오 */}
        <Pressable
          onPress={handleKakaoSignIn}
          className="w-full h-12 rounded-[13px] flex-row items-center justify-center gap-[10px] mb-2 active:opacity-80"
          style={{ backgroundColor: '#FEE500' }}
        >
          <Font tag="secondaryMedium" style={{ fontSize: 14, color: '#191919', letterSpacing: 0.3 }}>
            카카오로 계속하기
          </Font>
        </Pressable>

        {/* Apple */}
        {isAvailable ? (
          <AppleAuthentication.AppleAuthenticationButton
            buttonType={AppleAuthentication.AppleAuthenticationButtonType.CONTINUE}
            buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.BLACK}
            cornerRadius={13}
            style={{ width: '100%', height: 48, marginBottom: 8 }}
            onPress={handleAppleSignIn}
          />
        ) : (
          <View className="w-full h-12 rounded-[13px] bg-fillBold items-center justify-center mb-2">
            <Font tag="secondaryMedium" style={{ fontSize: 14, color: colors.textInverse, letterSpacing: 0.3 }}>
              Apple로 계속하기
            </Font>
          </View>
        )}

        {/* Google */}
        <Pressable
          onPress={handleGoogleSignIn}
          className="w-full h-12 rounded-[13px] bg-surfaceRaised border-[1.5px] border-border flex-row items-center justify-center gap-[10px] active:opacity-80"
        >
          <Font tag="secondaryMedium" style={{ fontSize: 14, color: colors.textPrimary, letterSpacing: 0.3 }}>
            Google로 계속하기
          </Font>
        </Pressable>
      </View>
    </View>
  );
}
