import { defineConfig, loadEnv } from 'vite';
import replace from '@rollup/plugin-replace';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  return {
    plugins: [
      replace({
        // Replace during the build process
        'process.env.VITE_SPOTIFY_CLIENT_ID': JSON.stringify(env.SPOTIFY_CLIENT_ID),
        'process.env.VITE_REDIRECT_URI': JSON.stringify(env.REDIRECT_URI),
        preventAssignment: true, // Prevents replacing values that are already defined.
      }),
    ],

    define: {
        //  Remove the variable injection in the `define` property
    },
  };
});