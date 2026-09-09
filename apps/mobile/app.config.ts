import { ConfigContext, ExpoConfig } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => {
  // `extra` is deliberately absent. The two keys it used to carry were read
  // from unset environment variables, so every build manifest shipped empty
  // strings that nothing ever read back via Constants.expoConfig.extra.
  // `eas init` writes `extra.eas.projectId` here when the EAS project exists.
  return {
    ...config,
    name: "PartyHause",
    slug: "partyhause-mobile",
    scheme: "partyhause",
    version: "1.0.0",
    orientation: "portrait",
    userInterfaceStyle: "automatic",
    // `newArchEnabled` is gone from ExpoConfig in SDK 57. The New Architecture
    // is no longer a flag: React Native 0.86 removed the legacy renderer, so
    // there is nothing left to enable and declaring it fails the config type.
    icon: "./assets/images/icon.png",
    description: "PartyHause helps you create unforgettable events with friends. Easily manage guest lists, send invitations, track RSVPs, share photos, and create lasting memories for birthdays, weddings, and any celebration.",
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.partyhause.mobile",
      buildNumber: "1.0.0",
      // Universal Links for invitation URLs.
      //
      // Only claimed now that `app/join/[token].tsx` exists. Claiming a path
      // with no screen behind it opens the app to expo-router's unmatched
      // screen instead of opening Safari, and Apple's CDN caches the
      // association, so that mistake outlives its fix.
      //
      // The published file at public/.well-known/apple-app-site-association
      // claims /join/* and nothing else, and its appID must stay in step with
      // `bundleIdentifier` above and the Team ID in eas.json.
      associatedDomains: ["applinks:partyhause.com"],
      infoPlist: {
        NSContactsUsageDescription: "PartyHause opens your contact picker so you can choose one person at a time to invite. It never reads your address book.",
        // Declared so every submission stops stalling on the export-compliance
        // prompt. The app uses only HTTPS, which is exempt.
        ITSAppUsesNonExemptEncryption: false,
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
        // Brand coral, not the Expo template's #E6F4FE. This is the fallback
        // fill for launchers that ignore backgroundImage; it must not be a
        // colour from outside the palette in docs/BRAND.md.
        backgroundColor: "#FF5233",
        foregroundImage: "./assets/images/android-icon-foreground.png",
        backgroundImage: "./assets/images/android-icon-background.png",
        monochromeImage: "./assets/images/android-icon-monochrome.png"
      },
      // `edgeToEdgeEnabled` was removed from the Android config in SDK 57.
      // Edge-to-edge is no longer opt-in: React Native 0.86 targets Android 16,
      // where the system draws behind the bars unconditionally and the opt-out
      // was deleted upstream. Declaring it now fails the config type check.
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
            // A separate asset, not just a separate background. The standard
            // mark's body is neutral-900 #26201D, which is invisible against
            // #000000; the dark variant uses the inverse mark so the house
            // still reads. Sharing one image would have shipped a floating
            // roof with no house under it.
            image: "./assets/images/splash-icon-dark.png",
            backgroundColor: "#000000"
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
