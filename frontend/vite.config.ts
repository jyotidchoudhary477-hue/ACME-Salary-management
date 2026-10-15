import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const proxyTarget = env.VITE_API_PROXY_TARGET || 'http://localhost:4000';

  return {
    plugins: [react(), tailwindcss()],
    server: {
      port: Number(env.VITE_DEV_PORT) || 5173,
      proxy: {
        '/api': {
          target: proxyTarget,
          changeOrigin: true,
        },
      },
    },
  };
});
