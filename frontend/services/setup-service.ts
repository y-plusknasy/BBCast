// TrackPlayer の初期化処理
// アプリ起動時に一度だけ呼び出す
import TrackPlayer, { Capability } from 'react-native-track-player';

let isSetup = false;

export async function setupPlayer(): Promise<boolean> {
  if (isSetup) return true;

  try {
    await TrackPlayer.setupPlayer();
    await TrackPlayer.updateOptions({
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.Stop,
      ],
    });
    isSetup = true;
  } catch (error) {
    console.error('TrackPlayer 初期化エラー:', error);
  }

  return isSetup;
}
