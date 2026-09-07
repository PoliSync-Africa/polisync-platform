import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'africa.polysync.app',
  appName: 'PoliSync Africa',
  webDir: '.next',
  server: {
    url: process.env.CAPACITOR_SERVER_URL || 'https://polisync-app.onrender.com',
    cleartext: false,
    androidScheme: 'https',
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: true,
      launchShowDuration: 1200,
      showSpinner: false,
    },
  },
};

export default config;
