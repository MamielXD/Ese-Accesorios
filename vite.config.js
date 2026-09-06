import path from 'node:path'
import react from '@vitejs/plugin-react'
import { createLogger, defineConfig } from 'vite'
import { compression } from 'vite-plugin-compression2'

// 🔧 Logger: solo silenciamiento del warning innecesario
const logger = createLogger()
const loggerError = logger.error
logger.error = (msg, options) => {
  if (options?.error?.toString().includes('CssSyntaxError: [postcss]')) {
    return
  }
  loggerError(msg, options)
}

export default defineConfig({
  root: './',
  base: '/',
  customLogger: logger,
  plugins: [
    react(),
    compression({
      algorithm: 'brotliCompress',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
    compression({
      algorithm: 'gzip',
      exclude: [/\.(br)$/, /\.(gz)$/],
    }),
  ],
  server: {
    cors: true,
    headers: {
      'Cross-Origin-Embedder-Policy': 'credentialless',
    },
    allowedHosts: true,
  },
  resolve: {
    extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: './dist',
    emptyOutDir: true,
    minify: 'terser', // Usar Terser para máxima compresión
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true,
      },
    },
  },
})
