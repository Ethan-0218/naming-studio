import React, { useEffect, useRef } from 'react';
import { Animated, View } from 'react-native';
import { colors } from '@/design-system';
import { Font } from '@/components/Font';

interface Props {
  label: string;
}

export default function TypingIndicator({ label }: Props) {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    function pulse(val: Animated.Value, delay: number) {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(val, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(val, {
            toValue: 0.3,
            duration: 300,
            useNativeDriver: true,
          }),
        ]),
      );
    }
    const a1 = pulse(dot1, 0);
    const a2 = pulse(dot2, 200);
    const a3 = pulse(dot3, 400);
    a1.start();
    a2.start();
    a3.start();
    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-end gap-1.5 mb-3">
      <View
        className="w-[26px] items-center justify-center rounded-[7px] flex-shrink-0"
        style={{
          height: 26,
          backgroundColor: colors.fillBold,
          marginBottom: 3,
        }}
      >
        <Font tag="primaryMedium" style={{ fontSize: 12, color: '#fff' }}>
          名
        </Font>
      </View>
      <View
        className="flex-row items-center gap-1 rounded-[16px] px-3.5 py-2.5 border border-border"
        style={{
          backgroundColor: colors.surfaceRaised,
          borderTopLeftRadius: 3,
        }}
      >
        {[dot1, dot2, dot3].map((val, i) => (
          <Animated.View
            key={i}
            style={{
              width: 5,
              height: 5,
              borderRadius: 99,
              backgroundColor: colors.textDisabled,
              opacity: val,
            }}
          />
        ))}
        <Font
          tag="secondary"
          style={{ fontSize: 12, color: colors.textDisabled, marginLeft: 4 }}
        >
          {label}
        </Font>
      </View>
    </View>
  );
}
