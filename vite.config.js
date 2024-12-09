import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    console.log('MODE:', mode);

    // Move define to the conditional logic where 'mode' is available
    const env = loadEnv(mode, process.cwd(), '');

    return {
        define: {
            'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(env.VITE_SPOTIFY_CLIENT_ID),
            'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(env.VITE_REDIRECT_URI),
            // ... other injected env variables
        },
        // ... rest of your config (plugins, etc.)
    };
});