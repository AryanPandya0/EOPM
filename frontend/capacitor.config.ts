import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
    appId: 'com.eopm.energyoptimizer',
    appName: 'EOPM Energy Optimizer',
    webDir: 'dist',
    server: {
        // Allow loading from HTTP backend (needed for API calls)
        cleartext: true,
    },
};

export default config;
