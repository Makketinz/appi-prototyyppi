import type { ExpoConfig } from "expo/config";

// EXPO_BASE_URL asetetaan vain GitHub Pages -buildissa (alipolku /appi-prototyyppi).
// Paikallisesti `expo start --web` toimii juuresta.
const baseUrl = process.env.EXPO_BASE_URL ?? "";

const config: ExpoConfig = {
  name: "Lastenvaatteet",
  slug: "appi-prototyyppi",
  version: "0.1.0",
  scheme: "lastenvaatteet",
  orientation: "portrait",
  icon: "./assets/icon.png",
  userInterfaceStyle: "light",
  ios: {
    supportsTablet: false,
  },
  android: {
    adaptiveIcon: {
      backgroundColor: "#E6F4FE",
      foregroundImage: "./assets/android-icon-foreground.png",
      backgroundImage: "./assets/android-icon-background.png",
      monochromeImage: "./assets/android-icon-monochrome.png",
    },
    predictiveBackGestureEnabled: false,
  },
  web: {
    favicon: "./assets/favicon.png",
    bundler: "metro",
    // Yksi index.html ja reititys selaimessa: GitHub Pagesissa 404.html on kopio
    // index.html:stä, jolloin syvälinkit (/koonnit, /lisaa) toimivat.
    output: "single",
  },
  experiments: {
    baseUrl,
    typedRoutes: true,
  },
  plugins: ["expo-router"],
};

export default config;
