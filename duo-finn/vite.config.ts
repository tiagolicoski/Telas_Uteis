import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { stateFilePlugin } from './server/statePlugin'

export default defineConfig({
  plugins: [react(), stateFilePlugin()],
})
