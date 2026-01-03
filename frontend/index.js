import 'react-native-reanimated';
import { Platform } from 'react-native';

// TrackPlayerのPlaybackServiceを登録
// Note: Web では react-native-track-player は動作しないため、ネイティブプラットフォームのみで登録
if (Platform.OS !== 'web') {
  const TrackPlayer = require('react-native-track-player').default;
  const { PlaybackService } = require('./services/PlaybackService');
  
  // PlaybackServiceの登録
  TrackPlayer.registerPlaybackService(() => PlaybackService);
}

import 'expo-router/entry';
