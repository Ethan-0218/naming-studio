import React from 'react';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NamingToolScreen } from '@/naming-tool';
import { RootStackParamList } from '@/navigation/types';

export default function SelfNamingScreen() {
  const navigation = useNavigation<any>();
  const { profileId } =
    useRoute<RouteProp<RootStackParamList, 'SelfNaming'>>().params;

  return (
    <NamingToolScreen
      onBack={() => navigation.goBack()}
      profileId={profileId}
      onChangeMyeongJu={() =>
        navigation.navigate('MyeongJuList', { mode: 'self' })
      }
    />
  );
}
