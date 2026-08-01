// Shardix Custom Theme
// Extends the default VitePress theme with custom styles and dark-by-default behavior

import DefaultTheme from 'vitepress/theme'
import './custom.css'
import { EnhanceAppContext } from 'vitepress'

export default {
  extends: DefaultTheme,
  enhanceApp({ app, router, siteData }: EnhanceAppContext) {
    // Force dark mode as the default appearance
    // This ensures the site always looks right even before hydration
    if (typeof window !== 'undefined') {
      // Set dark mode immediately to prevent flash of light theme
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    }
  },
}
