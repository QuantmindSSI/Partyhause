const { withInfoPlist } = require('expo/config-plugins');

const FORBIDDEN_USAGE_KEYS = [
  'NSCameraUsageDescription',
  'NSContactsUsageDescription',
  'NSLocationAlwaysAndWhenInUseUsageDescription',
  'NSLocationAlwaysUsageDescription',
  'NSLocationWhenInUseUsageDescription',
  'NSMicrophoneUsageDescription',
  'NSPhotoLibraryAddUsageDescription',
  'NSPhotoLibraryUsageDescription',
  'NSUserTrackingUsageDescription',
];

/** Remove permission declarations for capabilities excluded from IOS-MVP-1. */
function stripSensitiveUsageDescriptions(infoPlist) {
  for (const key of FORBIDDEN_USAGE_KEYS) {
    delete infoPlist[key];
  }
  return infoPlist;
}

function withMinimalIosPermissions(config) {
  return withInfoPlist(config, (configured) => {
    stripSensitiveUsageDescriptions(configured.modResults);
    return configured;
  });
}

module.exports = withMinimalIosPermissions;
module.exports.stripSensitiveUsageDescriptions = stripSensitiveUsageDescriptions;
