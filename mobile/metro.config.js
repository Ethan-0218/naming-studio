const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');
const { withNativeWind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

// 루트 레벨 공유 data/ 폴더 접근을 위해 부모 디렉토리를 watchFolders에 추가
config.watchFolders = [path.resolve(__dirname, '..')];

// @shared/data 별칭으로 루트 data/ 폴더 접근
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@shared/data': path.resolve(__dirname, '../data'),
  },
};

module.exports = withNativeWind(config, { input: './global.css' });
