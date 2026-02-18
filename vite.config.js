
// vite.config.js
import { resolve } from 'path'
import { defineConfig } from 'vite'

export default defineConfig({
  base: "/scsn/scsnweb/",
  build: {
    sourcemap: true,
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index.html'),
        heli: resolve(__dirname, 'helicorder/index.html'),
        historical: resolve(__dirname, 'historical/index.html'),
        global: resolve(__dirname, 'global/index.html'),
        software: resolve(__dirname, 'software/index.html'),
        about: resolve(__dirname, 'about/index.html'),
        contact: resolve(__dirname, 'contact/index.html'),
      },
    },
  },
})
