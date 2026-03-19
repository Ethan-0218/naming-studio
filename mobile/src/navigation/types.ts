import { NameData } from '@/ai-naming/types';

export type RootStackParamList = {
  Tabs: undefined;
  MyeongJuList: { mode?: 'ai' | 'self' };
  AddMyeongJu: { mode?: 'ai' | 'self' };
  AINaming: { sessionId: string; profileId: string };
  SelfNaming: { profileId: string };
  NameDetail: { nameData: NameData; profileId: string };
};

export type TabParamList = {
  홈: undefined;
  저장: undefined;
  내정보: undefined;
};
