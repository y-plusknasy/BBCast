const { withAndroidManifest } = require('@expo/config-plugins');

const withTrackPlayer = (config) => {
  return withAndroidManifest(config, async (config) => {
    const androidManifest = config.modResults;
    
    if (!androidManifest.manifest.application) {
      return config;
    }

    const mainApplication = androidManifest.manifest.application[0];

    // Add the service
    if (!mainApplication.service) {
      mainApplication.service = [];
    }

    const serviceName = 'com.doublesymmetry.trackplayer.service.MusicService';
    const hasService = mainApplication.service.some(
      (s) => s.$['android:name'] === serviceName
    );

    if (!hasService) {
      mainApplication.service.push({
        $: {
          'android:name': serviceName,
          'android:enabled': 'true',
          'android:exported': 'true',
          'android:foregroundServiceType': 'mediaPlayback',
          'android:stopWithTask': 'false',
        },
        'intent-filter': [
          {
            action: [
              {
                $: {
                  'android:name': 'android.media.browse.MediaBrowserService',
                },
              },
            ],
          },
        ],
      });
    }

    return config;
  });
};

module.exports = withTrackPlayer;
