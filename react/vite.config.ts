import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  base: '/smoking-tracker/',   // ★ 追加
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['apple-touch-icon.png', 'smoking_gap_banner.png', 'backimage.JPG'],
      manifest: {
        name: 'SmokingGap',
        short_name: 'SmokeGap',
        description: '喫煙間隔を可視化するアプリ',
        theme_color: '#ffffff',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/smoking-tracker/',   // ★ 修正
        scope: '/smoking-tracker/',       // ★ 追加
        icons: [
          {
            src: '/smoking-tracker/pwa-192x192.png',  // ★ 修正
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/smoking-tracker/pwa-512x512.png',  // ★ 修正
            sizes: '512x512',
            type: 'image/png'
          }
        ]
      }
    })
  ]
})
