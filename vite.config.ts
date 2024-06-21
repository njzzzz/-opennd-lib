import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'
import { getBuildOptions } from './config'

const __dirname = dirname(fileURLToPath(new URL(import.meta.url)))
export default defineConfig({
  plugins: [
    dts({
      entryRoot: __dirname,
      tsconfigPath: './tsconfig.json',
    }),
  ],
  build: getBuildOptions(resolve(__dirname, './index.ts')),
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./lib', import.meta.url)),
    },
  },
})
