import React from 'react';
import { Pressable, SafeAreaView, ScrollView, Text, View } from 'react-native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { textClassNames } from '@/design-system';
import { RootStackParamList } from '../navigation/types';

type HomeNavProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeNavProp>();

  return (
    <SafeAreaView className="flex-1 bg-bgSubtle">
      <ScrollView
        contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 20, paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="pt-10 pb-8 items-center">
          <Text className="font-serif-medium text-[36px] text-textPrimary tracking-[1px] mb-2">
            이름이 ✨
          </Text>
          <Text className="font-sans-regular text-[15px] text-textTertiary leading-[22px] text-center">
            아이에게 꼭 맞는 이름을 찾아보세요
          </Text>
        </View>

        <View className="gap-4">
          <Pressable
            className="bg-surfaceRaised rounded-xl border border-border overflow-hidden"
            style={({ pressed }) => ({
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => navigation.navigate('AINaming')}
          >
            <View className="h-1 bg-negative" />
            <View className="flex-row items-center p-6 gap-4">
              <Text className="text-[32px]">✨</Text>
              <View className="flex-1">
                <Text className="font-serif-medium text-[18px] text-textPrimary mb-1">
                  AI와 함께 이름짓기
                </Text>
                <Text className="font-sans-regular text-[13px] text-textTertiary leading-[18px]">
                  사주, 오행, 수리를 고려한 AI 추천
                </Text>
              </View>
              <Text className="font-sans-regular text-[24px] text-textDisabled">›</Text>
            </View>
          </Pressable>

          <Pressable
            className="bg-surfaceRaised rounded-xl border border-border overflow-hidden"
            style={({ pressed }) => ({
              shadowColor: '#000',
              shadowOpacity: 0.07,
              shadowRadius: 6,
              shadowOffset: { width: 0, height: 2 },
              elevation: 3,
              opacity: pressed ? 0.85 : 1,
            })}
            onPress={() => navigation.navigate('SelfNaming')}
          >
            <View className="h-1 bg-positive" />
            <View className="flex-row items-center p-6 gap-4">
              <Text className="text-[32px]">🔍</Text>
              <View className="flex-1">
                <Text className="font-serif-medium text-[18px] text-textPrimary mb-1">
                  스스로 이름짓기
                </Text>
                <Text className="font-sans-regular text-[13px] text-textTertiary leading-[18px]">
                  한자 의미와 조화를 직접 분석하기
                </Text>
              </View>
              <Text className="font-sans-regular text-[24px] text-textDisabled">›</Text>
            </View>
          </Pressable>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
