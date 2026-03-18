import React from 'react';
import { Pressable, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';
import { UserProfile } from '@/auth/AuthContext';

interface Props {
  profile: UserProfile;
}

function formatJoinDate(isoString: string): string {
  const d = new Date(isoString);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  return `${y}.${m} 가입`;
}

function ProviderTag({ provider }: { provider: string | null }) {
  if (provider === 'apple') {
    return (
      <View className="px-2 py-0.5 rounded-full bg-fillBold">
        <Font
          tag="secondaryMedium"
          style={{
            fontSize: 10.5,
            color: colors.textInverse,
            letterSpacing: 0.4,
          }}
        >
          애플 연동
        </Font>
      </View>
    );
  }
  if (provider === 'kakao') {
    return (
      <View
        className="px-2 py-0.5 rounded-full border"
        style={{ backgroundColor: '#FFFBD0', borderColor: '#EDD800' }}
      >
        <Font
          tag="secondaryMedium"
          style={{ fontSize: 10.5, color: '#7A6800', letterSpacing: 0.4 }}
        >
          카카오 연동
        </Font>
      </View>
    );
  }
  return null;
}

export default function ProfileCard({ profile }: Props) {
  const displayName = profile.displayName ?? '사용자';
  const email = profile.email ?? '';

  return (
    <View className="m-4">
      <Pressable className="flex-row items-center gap-[14px] p-4 pt-[18px] bg-surfaceRaised active:bg-surface rounded-xl border border-border">
        {/* Avatar */}
        <View className="w-[52px] h-[52px] rounded-full bg-bgSubtle border-[1.5px] border-borderStrong items-center justify-center">
          <Ionicons
            name="person-outline"
            size={26}
            color={colors.textTertiary}
          />
        </View>

        {/* Info */}
        <View className="flex-1 min-w-0">
          <Font
            tag="primaryMedium"
            className="mb-1"
            style={{
              fontSize: 18,
              color: colors.textPrimary,
              letterSpacing: 0.5,
            }}
          >
            {displayName}
          </Font>
          {email ? (
            <Font
              tag="secondary"
              className="mb-2"
              style={{ fontSize: 12.5, color: colors.textSecondary }}
              numberOfLines={1}
            >
              {email}
            </Font>
          ) : null}
          <View className="flex-row gap-[5px]">
            <ProviderTag provider={profile.oauthProvider} />
            <View className="px-2 py-0.5 rounded-full bg-surface border border-border">
              <Font
                tag="secondary"
                style={{
                  fontSize: 10.5,
                  color: colors.textTertiary,
                  letterSpacing: 0.4,
                }}
              >
                {formatJoinDate(profile.createdAt)}
              </Font>
            </View>
          </View>
        </View>

        {/* Chevron */}
        <Ionicons
          name="chevron-forward"
          size={18}
          color={colors.textDisabled}
        />
      </Pressable>
    </View>
  );
}
