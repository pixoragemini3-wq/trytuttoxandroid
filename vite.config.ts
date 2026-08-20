import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    let bloggerDomain = env.VITE_BLOGGER_DOMAIN || 'https://www.tuttoxandroid.com';
    if (!/^https?:\/\//i.test(bloggerDomain)) {
      bloggerDomain = 'https://' + bloggerDomain.replace(/^\/+/, '');
    }

    return {
      base: env.VITE_PUBLIC_BASE || '/trytuttoxandroid/',
      server: {
        port: 3000,
        host: '0.0.0.0',
        proxy: {
          // Proxy Blogger feeds so localhost can fetch real posts without CORS issues
          '/blogger': {
            target: bloggerDomain,
            changeOrigin: true,
            rewrite: (path) => path.replace(/^\/blogger/, ''),
            secure: false,
          }
        }
      },
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      build: {
        outDir: 'dist',
        // Stable, unhashed filenames: the Blogger template references this exact
        // URL directly, so it must not change between builds (cache-bust via ?v=).
        rollupOptions: {
          output: {
            entryFileNames: 'assets/txa-app.js',
            chunkFileNames: 'assets/txa-app-[name].js',
            assetFileNames: 'assets/txa-app.[ext]',
            inlineDynamicImports: true,
          }
        }
      }
    };
});
