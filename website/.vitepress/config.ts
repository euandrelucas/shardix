import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Shardix Framework',
  description: 'Enterprise Architecture Framework for Discord Applications & Bots',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/',

  // Force dark mode as default — our theme is designed dark-first
  appearance: 'dark',

  head: [
    // Favicon
    ['link', { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' }],
    ['link', { rel: 'icon', type: 'image/png', href: '/favicon.png' }],

    // Open Graph / Social
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'Shardix Framework' }],
    ['meta', { property: 'og:description', content: 'Enterprise Architecture Framework for Discord Bots. NestJS-inspired, zero vendor lock-in.' }],
    ['meta', { property: 'og:image', content: 'https://shardix.dev/og-image.png' }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['meta', { name: 'twitter:title', content: 'Shardix Framework' }],
    ['meta', { name: 'twitter:description', content: 'Enterprise Architecture Framework for Discord Bots.' }],

    // Theme color (Discord blurple)
    ['meta', { name: 'theme-color', content: '#5865f2' }],

    // Fonts preconnect for perf
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
  ],

  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'Class Index', link: '/api/classes' },
          { text: 'API Reference', link: '/api/overview' },
          { text: 'Ecosystem', link: '/guide/providers' },
          {
            text: 'v0.8.0',
            items: [
              { text: 'Changelog', link: 'https://github.com/euandrelucas/shardix/releases' },
              { text: 'npm', link: 'https://www.npmjs.com/org/shardix' },
            ],
          },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Fundamentals',
              collapsed: false,
              items: [
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Architecture & DI', link: '/guide/architecture' },
                { text: 'Events & Unified Context', link: '/guide/events' },
                { text: 'CLI 2.0 & Generator', link: '/guide/cli' },
              ],
            },
            {
              text: 'Building Blocks',
              collapsed: false,
              items: [
                { text: 'Universal Builders', link: '/guide/builders' },
                { text: 'Collectors & Iterators', link: '/guide/collectors' },
                { text: 'Cache Layer & Providers', link: '/guide/cache' },
                { text: 'Plugin Ecosystem', link: '/guide/plugins' },
                { text: 'Testing & Mock Layer', link: '/guide/testing' },
                { text: 'Voice Foundation', link: '/guide/voice' },
              ],
            },
            {
              text: 'Adapters & Runtimes',
              collapsed: false,
              items: [
                { text: 'Multi-Library Adapters', link: '/guide/adapters' },
                { text: 'Runtimes (Gateway, HTTP, Hybrid)', link: '/guide/runtimes' },
              ],
            },
            {
              text: 'Ecosystem & Scaling',
              collapsed: false,
              items: [
                { text: 'Official Providers', link: '/guide/providers' },
                { text: 'Workers & Clusters', link: '/guide/clusters' },
                { text: 'Control Plane Dashboard', link: '/guide/dashboard' },
                { text: 'Production Deployment', link: '/guide/deployment' },
              ],
            },
          ],
          '/api/': [
            {
              text: 'API Reference',
              items: [
                { text: 'Overview', link: '/api/overview' },
                { text: 'Complete Class Index', link: '/api/classes' },
                { text: '@shardix/core', link: '/api/core' },
                { text: '@shardix/common', link: '/api/common' },
                { text: '@shardix/plugin', link: '/api/plugin' },
                { text: '@shardix/testing', link: '/api/testing' },
                { text: 'Adapters API', link: '/api/adapters' },
                { text: 'Providers API', link: '/api/providers' },
                { text: 'Cluster & IPC API', link: '/api/cluster' },
              ],
            },
          ],
        },
      },
    },
    pt: {
      label: 'Português',
      lang: 'pt-BR',
      link: '/pt/',
      themeConfig: {
        nav: [
          { text: 'Guia', link: '/pt/guide/getting-started' },
          { text: 'Índice de Classes', link: '/pt/api/classes' },
          { text: 'Referência da API', link: '/pt/api/overview' },
          { text: 'Ecossistema', link: '/pt/guide/providers' },
          {
            text: 'v0.8.0',
            items: [
              { text: 'Changelog', link: 'https://github.com/euandrelucas/shardix/releases' },
              { text: 'npm', link: 'https://www.npmjs.com/org/shardix' },
            ],
          },
        ],
        sidebar: {
          '/pt/guide/': [
            {
              text: 'Fundamentos',
              collapsed: false,
              items: [
                { text: 'Introdução', link: '/pt/guide/introduction' },
                { text: 'Primeiros Passos', link: '/pt/guide/getting-started' },
                { text: 'Arquitetura e DI', link: '/pt/guide/architecture' },
                { text: 'Eventos e Contexto Unificado', link: '/pt/guide/events' },
                { text: 'CLI 2.0 & Gerador', link: '/pt/guide/cli' },
              ],
            },
            {
              text: 'Blocos de Construção',
              collapsed: false,
              items: [
                { text: 'Builders Universais', link: '/pt/guide/builders' },
                { text: 'Collectors & Iteradores', link: '/pt/guide/collectors' },
                { text: 'Camada de Cache & Provedores', link: '/pt/guide/cache' },
                { text: 'Ecossistema de Plugins', link: '/pt/guide/plugins' },
                { text: 'Testes & Camada Mock', link: '/pt/guide/testing' },
                { text: 'Fundação de Voz', link: '/pt/guide/voice' },
              ],
            },
            {
              text: 'Adapters e Runtimes',
              collapsed: false,
              items: [
                { text: 'Adapters Multi-Biblioteca', link: '/pt/guide/adapters' },
                { text: 'Runtimes (Gateway, HTTP, Híbrido)', link: '/pt/guide/runtimes' },
                { text: 'Benchmarks de Performance', link: '/pt/guide/benchmarks' },
              ],
            },
            {
              text: 'Ecossistema e Escala',
              collapsed: false,
              items: [
                { text: 'Provedores Oficiais', link: '/pt/guide/providers' },
                { text: 'Workers & Clusters', link: '/pt/guide/clusters' },
                { text: 'Dashboard Control Plane', link: '/pt/guide/dashboard' },
                { text: 'Deploy em Produção', link: '/pt/guide/deployment' },
              ],
            },
          ],
          '/pt/api/': [
            {
              text: 'Referência da API',
              items: [
                { text: 'Visão Geral', link: '/pt/api/overview' },
                { text: 'Índice Completo de Classes', link: '/pt/api/classes' },
                { text: '@shardix/core', link: '/pt/api/core' },
                { text: '@shardix/common', link: '/pt/api/common' },
                { text: '@shardix/plugin', link: '/pt/api/plugin' },
                { text: '@shardix/testing', link: '/pt/api/testing' },
                { text: 'API de Adapters', link: '/pt/api/adapters' },
                { text: 'API de Provedores', link: '/pt/api/providers' },
                { text: 'API de Cluster & IPC', link: '/pt/api/cluster' },
              ],
            },
          ],
        },
      },
    },
  },

  themeConfig: {
    logo: {
      light: '/logo-light.svg',
      dark: '/logo-dark.svg',
      alt: 'Shardix',
    },

    search: {
      provider: 'local',
      options: {
        translations: {
          button: {
            buttonText: 'Search docs...',
            buttonAriaLabel: 'Search documentation',
          },
        },
      },
    },

    socialLinks: [
      { icon: 'github', link: 'https://github.com/euandrelucas/shardix' },
      { icon: 'discord', link: 'https://discord.gg/shardix' },
      { icon: 'npm', link: 'https://www.npmjs.com/org/shardix' },
    ],

    editLink: {
      pattern: 'https://github.com/euandrelucas/shardix/edit/main/website/:path',
      text: 'Edit this page on GitHub',
    },

    lastUpdated: {
      text: 'Last updated',
      formatOptions: {
        dateStyle: 'medium',
      },
    },

    footer: {
      message: 'Released under the <a href="https://github.com/euandrelucas/shardix/blob/main/LICENSE">MIT License</a>. Join our <a href="https://discord.gg/shardix">Discord</a>!',
      copyright: 'Copyright © 2026 Shardix Core Team',
    },

    docFooter: {
      prev: 'Previous page',
      next: 'Next page',
    },

    outline: {
      level: [2, 3],
      label: 'On this page',
    },

    externalLinkIcon: true,
  },
});
