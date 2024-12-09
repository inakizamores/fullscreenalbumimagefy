import { defineConfig } from 'vite';

export default defineConfig({
  define: {
    'import.meta.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(process.env.SPOTIFY_CLIENT_ID),
    'import.meta.env.VITE_REDIRECT_URI': JSON.stringify(process.env.REDIRECT_URI),
  },
});