import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 3000,
    host: '0.0.0.0',  // 监听所有接口
    strictPort: true,
    cors: true,       // 启用CORS
    // 允许的主机名
    allowedHosts: [
      'localhost',
      '127.0.0.1',
      '172.27.2.191',
      'labubu.local',
      'labubu-gallery.local',
      'wallpaper.local',
      'gallery.local'
    ],
    proxy: {
      // 配置代理来解决CORS问题
      '/download-proxy': {
        target: 'https://labubuwallpaper.com',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/download-proxy/, ''),
        configure: (proxy, options) => {
          proxy.on('proxyReq', (proxyReq, req, res) => {
            console.log(`[Proxy] ==> Request: ${req.method} ${proxyReq.path}`);
          });
          proxy.on('proxyRes', (proxyRes, req, res) => {
            console.log(`[Proxy] <== Response: ${proxyRes.statusCode} ${req.url}`);
          });
          proxy.on('error', (err, req, res) => {
            console.error('[Proxy] Error: ', err);
          });
        }
      }
    }
  }
})
