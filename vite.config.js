import { defineConfig } from 'vite';

export default defineConfig(({ mode }) => {
    console.log('MODE:', mode); // This is good for debugging; keep it

    return {
        // root: './', // This is usually the default, so you might not need it. Comment it out to test.
        // base: '/',   // This is the default. If you're deploying to a subdirectory, change it there. Otherwise comment it out

        define: {
            'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID),
            'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(process.env.REDIRECT_URI),
            // Add other environment variables here if needed, but not the client secret
        },

        // If you are using any Vite plugins, add them here:
        // plugins: [
        //   // ... your plugins
        // ]
    };
});