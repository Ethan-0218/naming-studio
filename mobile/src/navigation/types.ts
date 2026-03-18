// Home tab stack
export type HomeStackParamList = {
  Home: undefined;
  MyeongJuList: { mode: 'ai' | 'self' };
  AddMyeongJu: { mode: 'ai' | 'self' };
  AINaming: undefined;
  SelfNaming: undefined;
};

// 저장 tab stack
export type SavedStackParamList = {
  SavedNames: undefined;
};

// 내 정보 tab stack (명주 관리 포함)
export type ProfileStackParamList = {
  MyProfile: undefined;
  MyeongJuManage: undefined;
  AddMyeongJu: undefined;
};

// Keep for backward compat — same shape as HomeStackParamList
export type RootStackParamList = HomeStackParamList;
