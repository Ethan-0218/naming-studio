import React from 'react';
import { ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors, primitives } from '@/design-system';
import { Font } from '@/components/Font';
import { useAuth } from '@/auth/AuthContext';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import ProfileCard from './ProfileCard';
import LoginCard from './LoginCard';
import SettingsGroup from './SettingsGroup';
import SettingsRow from './SettingsRow';
import LogoutButton from './LogoutButton';

const APP_VERSION = '1.0.0';

export default function MyProfileScreen() {
  const navigation = useNavigation<any>();
  const { auth } = useAuth();
  const isLoggedIn = !!auth.token;

  const { data: profiles = [] } = useMyeongJuList();
  const myeongJuCount = isLoggedIn ? profiles.length : null;

  return (
    <SafeAreaView className="flex-1 bg-bgSubtle" edges={['top']}>
      {/* Navbar */}
      <View className="h-14 px-5 justify-center bg-bgSubtle border-b border-border">
        <Font
          tag="primaryMedium"
          style={{ fontSize: 20, color: colors.textPrimary, letterSpacing: 2 }}
        >
          내 정보
        </Font>
        <Font
          tag="secondary"
          style={{ fontSize: 9, color: colors.textDisabled, letterSpacing: 2 }}
        >
          MY PAGE
        </Font>
      </View>

      <ScrollView className="flex-1 bg-bg" showsVerticalScrollIndicator={false}>
        {/* 로그인/비로그인 상단 카드 */}
        {isLoggedIn && auth.profile ? (
          <ProfileCard profile={auth.profile} />
        ) : (
          <LoginCard />
        )}

        {/* 이름공방 서비스 */}
        <SettingsGroup title="이름공방 서비스">
          <SettingsRow
            iconName="people-outline"
            iconBg={primitives.gold200}
            iconColor={primitives.gold600}
            label="명주 목록"
            badgeText={isLoggedIn ? `${myeongJuCount}개` : '로그인 필요'}
            badgeVariant={isLoggedIn ? 'count' : 'locked'}
            onPress={() =>
              isLoggedIn ? navigation.navigate('MyeongJuManage') : undefined
            }
          />
          <SettingsRow
            iconName="card-outline"
            iconBg={primitives.ink900}
            iconColor={primitives.hanji300}
            label="결제 내역"
            badgeText={isLoggedIn ? '무료 플랜' : '로그인 필요'}
            badgeVariant={isLoggedIn ? 'default' : 'locked'}
            isLast
          />
        </SettingsGroup>

        {/* 고객지원 */}
        <SettingsGroup title="고객지원">
          <SettingsRow
            iconName="chatbubble-ellipses-outline"
            iconBg={primitives.teal200}
            iconColor={primitives.teal600}
            label="문의하기"
            description="채팅으로 빠르게 답변받으세요"
          />
          <SettingsRow
            iconName="notifications-outline"
            iconBg={primitives.hanji300}
            iconColor={primitives.ink700}
            label="공지사항"
            badgeText="NEW"
            badgeVariant="new"
            isLast
          />
        </SettingsGroup>

        {/* 약관 및 정책 */}
        <SettingsGroup title="약관 및 정책">
          <SettingsRow
            iconName="document-text-outline"
            iconBg={primitives.hanji200}
            iconColor={primitives.ink500}
            label="이용약관"
          />
          <SettingsRow
            iconName="shield-checkmark-outline"
            iconBg={primitives.hanji200}
            iconColor={primitives.ink500}
            label="개인정보처리방침"
            isLast
          />
        </SettingsGroup>

        {/* 앱 버전 */}
        <View className="px-[36px] py-[14px] flex-row items-center justify-between">
          <Font
            tag="secondary"
            style={{
              fontSize: 13,
              color: colors.textTertiary,
              letterSpacing: 0.4,
            }}
          >
            앱 버전
          </Font>
          <Font
            tag="primary"
            style={{ fontSize: 13, color: colors.textDisabled }}
          >
            v {APP_VERSION}
          </Font>
        </View>

        {/* 로그아웃 */}
        {isLoggedIn && <LogoutButton />}

        <View className="h-6" />
      </ScrollView>
    </SafeAreaView>
  );
}
