import React from 'react';
import { View } from 'react-native';
import { Font } from '@/components/Font';

interface Props {
  title: string;
  children: React.ReactNode;
}

export default function SettingsGroup({ title, children }: Props) {
  return (
    <View>
      <Font
        tag="secondaryMedium"
        className="px-5 pt-5 pb-2 uppercase"
        style={{ fontSize: 10, color: '#C0AE92', letterSpacing: 2.2 }}
      >
        {title}
      </Font>
      <View className="mx-4 bg-surfaceRaised rounded-[18px] border border-border overflow-hidden">
        {children}
      </View>
    </View>
  );
}
