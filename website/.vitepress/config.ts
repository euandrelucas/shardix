import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Shardix Framework',
  description: 'Enterprise Architecture Framework for Discord Applications & Bots',
  cleanUrls: true,
  ignoreDeadLinks: true,
  base: '/shardix/',
  locales: {
    root: {
      label: 'English',
      lang: 'en-US',
      themeConfig: {
        nav: [
          { text: 'Guide', link: '/guide/getting-started' },
          { text: 'API Reference', link: '/api/overview' },
          { text: 'Ecosystem', link: '/guide/providers' },
          { text: 'GitHub', link: 'https://github.com/shardix/shardix' },
        ],
        sidebar: {
          '/guide/': [
            {
              text: 'Fundamentals',
              items: [
                { text: 'Introduction', link: '/guide/introduction' },
                { text: 'Getting Started', link: '/guide/getting-started' },
                { text: 'Architecture & DI', link: '/guide/architecture' },
                { text: 'Events & Interactions', link: '/guide/events' },
              ],
            },
            {
              text: 'Adapters & Runtimes',
              items: [
                { text: 'Multi-Library Adapters', link: '/guide/adapters' },
                { text: 'Runtimes (Gateway, HTTP, Hybrid)', link: '/guide/runtimes' },
              ],
            },
            {
              text: 'Ecosystem & Scaling',
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
                { text: '@shardix/core', link: '/api/core' },
                { text: '@shardix/common', link: '/api/common' },
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
          { text: 'Referência da API', link: '/pt/api/overview' },
          { text: 'Ecossistema', link: '/pt/guide/providers' },
          { text: 'GitHub', link: 'https://github.com/shardix/shardix' },
        ],
        sidebar: {
          '/pt/guide/': [
            {
              text: 'Fundamentos',
              items: [
                { text: 'Introdução', link: '/pt/guide/introduction' },
                { text: 'Primeiros Passos', link: '/pt/guide/getting-started' },
                { text: 'Arquitetura e DI', link: '/pt/guide/architecture' },
                { text: 'Eventos e Interações', link: '/pt/guide/events' },
              ],
            },
            {
              text: 'Adapters e Runtimes',
              items: [
                { text: 'Adapters Multi-Biblioteca', link: '/pt/guide/adapters' },
                { text: 'Runtimes (Gateway, HTTP, Híbrido)', link: '/pt/guide/runtimes' },
              ],
            },
            {
              text: 'Ecossistema e Escala',
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
                { text: '@shardix/core', link: '/pt/api/core' },
                { text: '@shardix/common', link: '/pt/api/common' },
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
    logo: '⚡',
    search: {
      provider: 'local',
    },
    socialLinks: [
      { icon: 'github', link: 'https://github.com/shardix/shardix' },
    ],
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2026 Shardix Core Team',
    },
  },
});
