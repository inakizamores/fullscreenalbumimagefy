import { defineConfig } from 'vite';

export default defineConfig({
  // Add any other Vite configuration here
  define: {
    'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID),
    'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(process.env.REDIRECT_URI),
  },
});