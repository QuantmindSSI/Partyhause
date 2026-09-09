import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  return {
    ...config,
    name: "PartyHause",
    slug: "partyhause-mobile",
    platforms: ["ios"],
    scheme: "partyhause",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    icon: "./assets/images/icon.png",
    description: "Create and organize private event details from one place.",
    ios: {
      supportsTablet: false,
      bundleIdentifier: "com.partyhause.mobile",
      buildNumber: "1",
      config: {
        usesNonExemptEncryption: false
      }
    },
    plugins: [
      "expo-router",
      "@react-native-community/datetimepicker",
      "./plugins/with-minimal-ios-permissions",
      [
        "expo-build-properties",
        {
          ios: {
            deploymentTarget: "17.0"
          }
        }
      ],
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#FBFAF9",
          dark: {
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#181311"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    }
  };
};
