import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // 加载环境变量
  const env = loadEnv(mode, process.cwd())

  return {
    plugins: [react()],
    base: env.VITE_PUBLIC_URL || './',
    define: {
      'process.env': env
    },
    server: {
      host: true, // 监听所有地址，包括本地和网络地址
      // port: 3000, // 设置端口号
      // proxy: {
      //   '/templateCms': {
      //     target:'https://backend-test.7mfitness.com',
      //     changeOrigin: true,
      //   },
      // }
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, './src'),
        '@/components': resolve(__dirname, './src/components'),
        '@/pages': resolve(__dirname, './src/pages'),
        '@/assets': resolve(__dirname, './src/assets'),
        '@/store': resolve(__dirname, './src/store'),
        '@/utils': resolve(__dirname, './src/utils'),
        '@/hooks': resolve(__dirname, './src/hooks'),
        '@/config': resolve(__dirname, './src/config'),
        '@/constants': resolve(__dirname, './src/constants')
      }
    },
    assetsInclude: ['**/*.svg'],
  }
})
