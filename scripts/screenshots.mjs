/**
 * Captura as imagens do README em docs/screenshots/.
 * Requer o dev server rodando (npm run dev) e o Microsoft Edge instalado.
 * Uso: node scripts/screenshots.mjs [caminho-do-chrome-ou-edge]
 */
import puppeteer from 'puppeteer-core'
import { existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = resolve(RAIZ, 'docs', 'screenshots')
mkdirSync(DESTINO, { recursive: true })

const CANDIDATOS = [
  process.argv[2],
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
].filter(Boolean)
const navegador = CANDIDATOS.find((p) => existsSync(p))
if (!navegador) {
  console.error('Nenhum Edge/Chrome encontrado — passe o caminho do executável como argumento.')
  process.exit(1)
}

const BASE = 'http://localhost:5173'

const SHOTS = [
  { arquivo: 'inicio.png', url: `${BASE}/#/`, tema: 'claro', espera: 2600 },
  { arquivo: 'calculadora.png', url: `${BASE}/#/calculadora?preco=1000&cat=produto-padrao&ano=2033&uf=SP`, tema: 'claro', espera: 1400 },
  { arquivo: 'linha-do-tempo.png', url: `${BASE}/#/linha-do-tempo?ano=2029`, tema: 'claro', espera: 1400 },
  { arquivo: 'setores.png', url: `${BASE}/#/setores`, tema: 'claro', espera: 1400 },
  { arquivo: 'inicio-escuro.png', url: `${BASE}/#/`, tema: 'escuro', espera: 2600 },
]

const browser = await puppeteer.launch({ executablePath: navegador, headless: true, args: ['--no-first-run'] })

for (const shot of SHOTS) {
  const page = await browser.newPage()
  await page.setViewport({ width: 1360, height: 860, deviceScaleFactor: 1.5 })
  await page.evaluateOnNewDocument((tema) => {
    try {
      localStorage.setItem('tema', tema)
    } catch {
      /* sem storage */
    }
  }, shot.tema)
  await page.goto(shot.url, { waitUntil: 'networkidle0', timeout: 45000 })
  await page.evaluate(() => document.fonts.ready)
  await new Promise((r) => setTimeout(r, shot.espera))
  await page.screenshot({ path: resolve(DESTINO, shot.arquivo) })
  console.log('ok:', shot.arquivo)
  await page.close()
}

await browser.close()
console.log('capturas em', DESTINO)
