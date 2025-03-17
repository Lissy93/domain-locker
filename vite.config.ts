/// <reference types="vitest" />
import analog, { PrerenderContentFile } from '@analogjs/platform';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
import packageJson from './package.json';
import * as path from 'node:path';

const themeTargets = [
  {
    src: 'node_modules/primeng/resources/themes/lara-dark-purple/theme.css',
    rename: 'purple-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/lara-light-purple/theme.css',
    rename: 'purple-light.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/vela-orange/theme.css',
    rename: 'orange-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/saga-orange/theme.css',
    rename: 'orange-light.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/md-dark-indigo/theme.css',
    rename: 'indigo-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/md-light-indigo/theme.css',
    rename: 'indigo-light.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/bootstrap4-dark-blue/theme.css',
    rename: 'blue-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/bootstrap4-light-blue/theme.css',
    rename: 'blue-light.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/lara-dark-teal/theme.css',
    rename: 'teal-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/lara-light-teal/theme.css',
    rename: 'teal-light.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/arya-green/theme.css',
    rename: 'green-dark.css',
  },
  {
    src: 'node_modules/primeng/resources/themes/saga-green/theme.css',
    rename: 'green-light.css',
  },
];

export default defineConfig( ({ mode }) => {

  const env = loadEnv(mode, process.cwd(), '')
  const buildPreset = env['BUILD_PRESET'] || env['NITRO_PRESET'] || 'node';

  const nitroPreset = (() => {
    switch (buildPreset) {
      case 'vercel':
        console.log('🔼 Building for Vercel');
        return 'vercel';
      case 'netlify':
        console.log('🪁 Building for Netlify');
        return 'netlify';
      case 'deno':
      case 'deno_server':
        console.log('🦕 Building for Deno');
        return 'deno_server';
      case 'bun':
        console.log('🐰 Building for Bun');
        return 'bun';
      default:
        console.log('🚀 Building for Node.js');
        return 'node-server';
    }
  })();

  return {
    base: '/',
    publicDir: 'src/assets',
    optimizeDeps: {
      include: ['rxjs', '@angular/core', '@angular/common', '@angular/platform-browser'],
      exclude: [
        'zone.js', 
        '@supabase/supabase-js', 
        'whois-json', 
        'dotenv', 
        'pg', 
        '@sentry/angular', 
        'ngx-turnstile',
        'file-saver',
        'fuse.js',
        'leaflet',
        'apexcharts'
      ],
    },
    ssr: {
      noExternal: [
        '@spartan-ng/**',
        '@angular/cdk/**',
        '@ng-icons/**',
      ]
    },
    build: {
      target: ['es2020'],
      sourcemap: mode === 'development' ? 'inline' : false,
      outDir: 'dist',
      assetsDir: 'assets',
      chunkSizeWarningLimit: 512,
      minify: 'terser',
      rollupOptions: {
        output: {
          // inlineDynamicImports: mode === 'production',
          manualChunks(id: string) {
            if (id.includes('node_modules')) {
              if (id.includes('angular') || id.includes('zone.js')) return 'angular-core';
              if (id.includes('primeng') || id.includes('primeicons')) return 'primeng';
              if (id.includes('apexcharts') || id.includes('ng-apexcharts')) return 'charts';
              if (id.includes('leaflet')) return 'maps';
              if (id.includes('d3')) return 'd3-visuals';
              if (id.includes('mermaid')) return 'mermaid-diagrams';
              if (id.includes('@sentry')) return 'sentry';
              if (id.includes('@supabase')) return 'supabase';
              if (id.includes('marked') || id.includes('prismjs')) return 'markdown';
              if (id.includes('file-saver')) return 'file-handling';
              if (id.includes('dotenv') || id.includes('pg')) return 'backend-utils';
              if (id.includes('rxjs')) return 'rxjs';
              return 'vendor';
            }
            return null;
          }
        }
      }
    },
    resolve: {
      alias: {
        '~': path.resolve(__dirname, './src'),
      },
    },
    plugins: [
      analog({
        prerender: {
          routes: [ // Unauthenticated SSG routes
            '/',
            '/login',
            '/about',
            '/about/*',
            {
              contentDir: 'src/content/docs/developing',
              transform: (file: PrerenderContentFile) => {
                const slug = file.attributes['slug'] || file.name;
                return `/about/developing/${slug}`;
              },
            },
            {
              contentDir: 'src/content/docs/legal',
              transform: (file: PrerenderContentFile) => {
                const slug = file.attributes['slug'] || file.name;
                return `/about/legal/${slug}`;
              },  
            },
          ],
          sitemap: {
            host: 'https://domain-locker.com',
          },
          
        },
        nitro: {
          preset: nitroPreset,
          inlineDeferedImports: true,
          minify: true,
          scanHandlers: false,
          serveStatic: false,
          esbuild: { minify: true },
          dev: mode === 'development',
        },
        content: {
          highlighter: 'prism',
          prismOptions: {
            additionalLangs: ['diff', 'yaml'],
          },
        },
      }),
      viteStaticCopy({
        targets: themeTargets.map((target) => ({
          src: target.src,
          dest: 'themes',
          rename: target.rename,
        })),
      }),
    ],

    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: ['src/test.ts'],
      include: ['**/*.spec.ts'],
    },
    envPrefix: ['VITE_', 'SUPABASE_', 'DL_'],
    define: {
      'import.meta.vitest': mode !== 'production',
      __APP_VERSION__: JSON.stringify(packageJson.version),
      __APP_NAME__: JSON.stringify(env['APP_NAME'] || 'Domain Locker'),
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  };
});
