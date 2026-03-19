import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import NavBar from '@/components/NavBar';
import MyeongJuStrip from '@/naming-tool/components/MyeongJuStrip';
import { useMyeongJuList } from '@/myeongju/hooks/useMyeongJuList';
import { usePurchaseStatus } from '@/payment/hooks/usePurchaseStatus';
import AIPaymentModal from '@/payment/components/AIPaymentModal';
import MessageBubble from '@/ai-naming/components/MessageBubble';
import DolrimjaModal from '@/ai-naming/components/DolrimjaModal';
import ReasonPicker from '@/ai-naming/components/ReasonPicker';
import SessionRestoreModal from '@/ai-naming/components/SessionRestoreModal';
import TypingIndicator from '@/ai-naming/components/TypingIndicator';
import DevToolbar from '@/ai-naming/components/DevToolbar';
import LikedNamesPanel from '@/ai-naming/components/LikedNamesPanel';
import PaymentBanner from '@/ai-naming/components/PaymentBanner';
import ChatInputBar from '@/ai-naming/components/ChatInputBar';
import { useAINamingSession } from '@/ai-naming/hooks/useAINamingSession';
import { RootStackParamList } from '../navigation/types';

type AINamingNavProp = NativeStackNavigationProp<
  RootStackParamList,
  'AINaming'
>;
type AINamingRoute = RouteProp<RootStackParamList, 'AINaming'>;

export default function AINamingScreen() {
  const navigation = useNavigation<AINamingNavProp>();
  const route = useRoute<AINamingRoute>();
  const { profileId } = route.params;
  const insets = useSafeAreaInsets();

  const { data: profiles = [] } = useMyeongJuList();
  const profile = profiles.find((p) => p.id === profileId) ?? null;

  const session = useAINamingSession(profile);
  const { data: purchaseStatus } = usePurchaseStatus(
    session.sessionId ?? undefined,
  );

  const scrollRef = useRef<ScrollView>(null);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
  }, [session.messages, session.loading]);

  return (
    <View className="flex-1 bg-bg">
      <StatusBar style="dark" />

      <View style={{ paddingTop: insets.top }}>
        <NavBar
          title="AI와 함께 이름짓기"
          subtitle="AI 작명"
          onBack={() => navigation.goBack()}
        />
      </View>

      {__DEV__ && (
        <DevToolbar
          showDebug={session.showDebug}
          onToggleDebug={() => session.setShowDebug((v) => !v)}
          onReset={session.handleReset}
        />
      )}

      {profile && <MyeongJuStrip profile={profile} readOnly />}

      {session.showLiked && <LikedNamesPanel likedNames={session.likedNames} />}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <ScrollView
          ref={scrollRef}
          className="flex-1 bg-bg"
          contentContainerStyle={{ padding: 13, paddingBottom: 8 }}
        >
          {session.messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              msg={msg}
              liked={session.likedNames}
              disliked={session.dislikedNames}
              onLike={session.handleLike}
              onDislike={session.handleDislike}
              showDebug={session.showDebug}
              onSend={session.sendMessage}
            />
          ))}
          {session.loading && (
            <TypingIndicator
              label={session.progressMessage ?? '이름이가 생각 중...'}
            />
          )}
        </ScrollView>

        {session.paymentRequired && (
          <PaymentBanner onPress={() => session.setShowPaymentModal(true)} />
        )}

        <ChatInputBar
          input={session.input}
          onChangeText={session.setInput}
          onSend={session.handleSend}
          canInput={session.canInput}
          loading={session.loading}
          paddingBottom={Math.max(insets.bottom, 10)}
        />
      </KeyboardAvoidingView>

      <DolrimjaModal
        visible={session.dolrimjaModalOpen}
        onClose={() => session.setDolrimjaModalOpen(false)}
        onSubmit={session.handleDolrimjaUpdate}
        loading={session.loading}
      />

      <SessionRestoreModal
        visible={session.restoreModalOpen}
        onClose={() => session.setRestoreModalOpen(false)}
        onRestore={session.handleSessionRestore}
      />

      <AIPaymentModal
        visible={session.showPaymentModal}
        sessionId={session.sessionId ?? ''}
        purchasedCount={purchaseStatus?.aiNamingPurchasedCount ?? 0}
        onClose={() => session.setShowPaymentModal(false)}
        onSuccess={() => {
          session.setShowPaymentModal(false);
          session.handlePayment();
        }}
      />

      <ReasonPicker
        visible={session.reasonPickerVisible}
        name={session.reasonPickerContext?.name ?? ''}
        type={session.reasonPickerContext?.type ?? 'liked'}
        onSubmit={session.handleReasonPickerSubmit}
        onSkip={session.handleReasonPickerSkip}
      />
    </View>
  );
}
