// Solo el subconjunto latino: el sitio es un único HTML con las fuentes dentro.
import '@fontsource/barlow-condensed/latin-600.css'
import '@fontsource/barlow-condensed/latin-700.css'
import '@fontsource/barlow-semi-condensed/latin-400.css'
import '@fontsource/barlow-semi-condensed/latin-400-italic.css'
import '@fontsource/barlow-semi-condensed/latin-600.css'
import '@fontsource/b612-mono/latin-400.css'
import '@fontsource/b612-mono/latin-700.css'
import '@fontsource/dseg7-classic/latin-700.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { App } from './App'
import { Brief } from './Brief'
import { Demos } from './Demos'
import { reduced } from './panel/motion'
import './styles.css'

// ?vista=brief muestra el documento de 2 páginas que se imprime a PDF.
const brief = new URLSearchParams(window.location.search).get('vista') === 'brief'
document.documentElement.classList.toggle('print-view', brief)
document.documentElement.classList.toggle('reduce', reduced())
// /demos/ es una copia de este mismo index.html (deploy.sh): la guía de estudio con un demo por decisión.
const demos = /\/demos(\/(index\.html)?)?$/.test(window.location.pathname)

createRoot(document.getElementById('root')!).render(<StrictMode>{brief ? <Brief /> : demos ? <Demos /> : <App />}</StrictMode>)
