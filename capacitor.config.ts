import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.lovable.8ff7ab7167654a298b5a5a93fb85932f',
  appName: 'Xscentrium',
  webDir: 'dist',
  server: {
    url: 'https://8ff7ab71-6765-4a29-8b5a-5a93fb85932f.lovableproject.com?forceHideBadge=true',
    cleartext: true,
  },
  ios: {
    contentInset: 'always',
  },
};

export default config;
