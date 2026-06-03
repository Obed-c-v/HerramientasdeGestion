import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.starter',
  appName: 'parkinsong',
  webDir: 'www',
  plugins: {
    SocialLogin: {
      providers: {
        google: true
      }
    }
  }
};

export default config;
