module.exports = {
  expo: {
    name: "Husika TTS",
    slug: "husika-tts-boilerplate",
    version: "1.0.0",
    orientation: "portrait",
    icon: "./assets/images/husika-logo.png",
    scheme: "husikattsboilerplate",
    userInterfaceStyle: "light",
    newArchEnabled: true,
    ios: {
      supportsTablet: true,
      bundleIdentifier: "com.meddhiakassab.husikattsboilerplate",
      icon: "./assets/images/husika-logo.png",
    },
    android: {
      adaptiveIcon: {
        backgroundColor: "#547742",
        foregroundImage: "./assets/images/husika-logo.png",
        monochromeImage: "./assets/images/husika-logo.png",
      },
      edgeToEdgeEnabled: true,
      predictiveBackGestureEnabled: false,
      package: "com.meddhiakassab.husikattsboilerplate",
    },
    web: {
      output: "static",
      favicon: "./assets/images/husika-logo.png",
    },
    plugins: [
      "expo-router",
      [
        "expo-splash-screen",
        {
          image: "./assets/images/husika-logo.png",
          imageWidth: 180,
          resizeMode: "contain",
          backgroundColor: "#547742",
        },
      ],
      // ✅ 16 KB page size fix
      [
        "expo-build-properties",
        {
          android: {
            androidGradlePluginVersion: "8.6.0",
            compileSdkVersion: 35,
            targetSdkVersion: 35,
            buildToolsVersion: "35.0.0",
            ndkVersion: "29.0.13113456",
          },
        },
      ],
    ],
    experiments: {
      typedRoutes: true,
      reactCompiler: true,
    },
    extra: {
      router: {},
      eas: {
        projectId: "6f500a4d-c64e-42bb-9c77-787a9888bf67",
      },
    },
    owner: "meddhiakassab",
  },
};
