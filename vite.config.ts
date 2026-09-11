import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { execSync } from 'child_process';

// Plugin customizado para automatizar a geração do catálogo sem scripts manuais
function catalogGeneratorPlugin() {
  return {
    name: 'catalog-generator',
    buildStart() {
      console.log('📦 Inicializando e gerando catálogo de artigos...');
      try {
        execSync('node scripts/generate-catalog.js', { stdio: 'inherit' });
      } catch (err) {
        console.error('Erro ao gerar catálogo:', err);
      }
    },
    handleHotUpdate({ file, server }) {
      if (file.endsWith('.md') && file.includes('src/content/artigos')) {
        console.log(`📝 Artigo alterado: ${path.basename(file)}. Regenerando catálogo...`);
        try {
          execSync('node scripts/generate-catalog.js', { stdio: 'inherit' });
          server.ws.send({ type: 'full-reload' });
        } catch (err) {
          console.error('Erro ao regenerar catálogo:', err);
        }
      }
    }
  };
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: Number(process.env.PORT) || 3000,
      host: process.env.HOST || 'localhost',
    },
    plugins: [
      catalogGeneratorPlugin(),
      react(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg'],
        manifest: {
          name: 'SST FAQ - Base de Conhecimento',
          short_name: 'SST FAQ',
          description: 'Base de conhecimento sobre Saúde e Segurança do Trabalho',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: 'pwa-192x192.png',
              sizes: '192x192',
              type: 'image/png'
            },
            {
              src: 'pwa-512x512.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'any maskable'
            }
          ]
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,json}'],
          runtimeCaching: [
            // Estratégia StaleWhileRevalidate para dados do catálogo e chunks de artigos (sempre atualizado em background, instantâneo offline)
            {
              urlPattern: /.*(?:catalog\.json|chunks\/.*\.json)$/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'sst-knowledge-content-cache',
                expiration: {
                  maxEntries: 100,
                  maxAgeSeconds: 60 * 60 * 24 * 30 // 30 dias
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Estratégia CacheFirst para imagens e assets de interface
            {
              urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|avif|ico)$/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'sst-ui-images-cache',
                expiration: {
                  maxEntries: 60,
                  maxAgeSeconds: 60 * 60 * 24 * 60 // 60 dias
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            },
            // Estratégia CacheFirst para Web Fonts (Google Fonts & gstatic)
            {
              urlPattern: /^https:\/\/(?:fonts\.googleapis\.com|fonts\.gstatic\.com)\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-cache',
                expiration: {
                  maxEntries: 20,
                  maxAgeSeconds: 60 * 60 * 24 * 365
                },
                cacheableResponse: {
                  statuses: [0, 200]
                }
              }
            }
          ]
        }
      })
    ],
    define: {
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom', 'react-router-dom', 'react-helmet-async'],
            'ui-vendor': ['gsap', '@gsap/react', 'lucide-react', 'cmdk'],
            'utils-vendor': ['minisearch', 'dompurify', 'marked']
          }
        }
      },
      chunkSizeWarningLimit: 800
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      }
    }
  };
});
