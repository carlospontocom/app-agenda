import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'

export default defineConfig({
  plugins: [vue()],
  css: {
    preprocessorOptions: {
      scss: {
        api: 'modern',
        quietDeps: true
      }
    }
  },
  server: {
    port: 5173
  }
})
