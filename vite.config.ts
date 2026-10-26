import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'
import { viteSingleFile } from 'vite-plugin-singlefile'

// Un solo index.html con JS, CSS y tipografías dentro: funciona en GitHub Pages, sin internet y con doble clic.
export default defineConfig({ base: './', plugins: [react(), viteSingleFile()] })
