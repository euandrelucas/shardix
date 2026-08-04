// Shardix Custom Theme
// Extends the default VitePress theme with custom styles and dark-by-default behavior

import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { EnhanceAppContext } from 'vitepress'
import BenchmarkCharts from '../components/BenchmarkCharts.vue'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }: EnhanceAppContext) {
    // Register BenchmarkCharts globally so it can be used in any .md page
    app.component('BenchmarkCharts', BenchmarkCharts)

    // Force dark mode as the default appearance
    if (typeof window !== 'undefined') {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  },
}
