import { defineConfig, loadEnv } from 'vite';  // Import loadEnv

export default defineConfig(({ mode }) => {
    console.log('MODE:', mode);

    const env = loadEnv(mode, process.cwd(), ''); // Load env variables

    return {
        define: {
            'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(env.VITE_SPOTIFY_CLIENT_ID),
            'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(env.VITE_REDIRECT_URI),
        },
    };
});