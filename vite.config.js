import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Site estático: o "back-end" agora é o Supabase, então não há proxy para API.
export default defineConfig({
  plugins: [react()],
})
