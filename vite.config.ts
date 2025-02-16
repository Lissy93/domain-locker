/// <reference types="vitest" />
import analog, { PrerenderContentFile } from '@analogjs/platform';
import { defineConfig, loadEnv } from 'vite';
import { viteStaticCopy } from 'vite-plugin-static-copy';
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
      default:
        console.log('🚀 Building for Node.js');
        return 'node-server';
    }
  })();

  return {
    base: '/',
    publicDir: 'src/assets',
    optimizeDeps: {
      include: ['@angular/common'],
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
    },
    server: {
      fs: {
        allow: ['..'],
      },
    },
  };
});
