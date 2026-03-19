export type RootStackParamList = {
  Tabs: undefined;
  MyeongJuList: { mode?: 'ai' | 'self' };
  AddMyeongJu: { mode?: 'ai' | 'self' };
  AINaming: { sessionId: string; profileId: string };
  SelfNaming: { profileId: string };
};

export type TabParamList = {
  홈: undefined;
  저장: undefined;
  내정보: undefined;
};
