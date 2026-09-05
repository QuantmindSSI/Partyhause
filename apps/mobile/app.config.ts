import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? "";
  const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? "";

  return {
    ...config,
    name: "PartyHause",
    slug: "partyhause-mobile",
    scheme: "partyhause",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    newArchEnabled: true,
    icon: "./assets/images/icon.png",
    description: "PartyHause helps you create unforgettable events with friends. Easily manage guest lists, send invitations, track RSVPs, share photos, and create lasting memories for birthdays, weddings, and any celebration.",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.partyhause.mobile",
      buildNumber: "1.0.0",
      infoPlist: {
        NSContactsUsageDescription: "PartyHause opens your contact picker so you can choose one person at a time to invite. It never reads your address book.",
      }
    },
    android: {
      package: "com.partyhause.mobile",
      versionCode: 1,
      permissions: [
        "READ_CONTACTS",
        "CAMERA",
        "READ_EXTERNAL_STORAGE",
        "WRITE_EXTERNAL_STORAGE",
        "READ_MEDIA_IMAGES",
        "READ_MEDIA_VIDEO"
      ],
      adaptiveIcon: {
        backgroundColor: "#E6F4FE",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false
    },
    web: {
      output: "static",
      favicon: "./assets/images/favicon.png",
      bundler: "metro",
      build: {
        babel: {
          include: ["@partyhause/core"]
        }
      },
      config: {
        firebase: {
          apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
          authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
          projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID
        }
      }
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#ffffff",
          dark: {
            backgroundColor: "#000000"
          }
        }
      ]
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true
    },
    extra: {
      supabaseUrl,
      supabaseAnonKey
    }
  };
};
