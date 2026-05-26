import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { writeFileSync, readFileSync } from 'fs'

function copyIndexHtmlPlugin() {
  return {
    name: 'copy-index-html',
    writeBundle() {
      const index = readFileSync('dist/index.html', 'utf-8');
      writeFileSync('dist/404.html', index);
    }
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), copyIndexHtmlPlugin()],
  base: '/DutyWebTub2',
})
