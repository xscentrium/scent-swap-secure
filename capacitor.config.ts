import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8ff7ab7167654a298b5a5a93fb85932f',
  appName: 'Xscentrium',
  webDir: 'dist',
  // 🔥 Hot-reload from Lovable preview during development.
  // ⚠️ Before submitting to the App Store, DELETE the `server` block
  //    so the app ships with the bundled `dist/` assets instead.
  server: {
    url: 'https://8ff7ab71-6765-4a29-8b5a-5a93fb85932f.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 1500,
      backgroundColor: '#0a0a0a',
      showSpinner: false,
    },
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert'],
    },
  },
};

export default config;
