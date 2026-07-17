/**
 * Captura as imagens do README em docs/screenshots/.
 * Requer o dev server rodando (npm run dev).
 * Uso: node scripts/screenshots.mjs [caminho-do-chrome-ou-edge]
 *
 * Tenta o launch normal do puppeteer; se falhar (nesta máquina o headless
 * do Edge quebra o launch com "Code: 0"), abre o Chrome por CLI com porta
 * de depuração remota e conecta via puppeteer.connect().
 */
import puppeteer from 'puppeteer-core'
import { spawn } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = resolve(RAIZ, 'docs', 'screenshots')
mkdirSync(DESTINO, { recursive: true })

const CANDIDATOS = [
  process.argv[2],
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe`,
  String.raw`C:\Program Files\Microsoft\Edge\Application\msedge.exe`,
].filter(Boolean)
const navegador = CANDIDATOS.find((p) => existsSync(p))
if (!navegador) {
  console.error('Nenhum Chrome/Edge encontrado — passe o caminho do executável como argumento.')
  process.exit(1)
}

const BASE = 'http://localhost:5173'

const SHOTS = [
  { arquivo: 'inicio.png', url: `${BASE}/#/`, tema: 'claro', espera: 2600 },
  { arquivo: 'calculadora.png', url: `${BASE}/#/calculadora?preco=1000&cat=produto-padrao&ano=2033&uf=SP`, tema: 'claro', espera: 1400 },
  { arquivo: 'cesta.png', url: `${BASE}/#/cesta`, tema: 'claro', espera: 1400 },
  { arquivo: 'raio-x.png', url: `${BASE}/#/raio-x`, tema: 'claro', espera: 1600 },
  { arquivo: 'linha-do-tempo.png', url: `${BASE}/#/linha-do-tempo?ano=2029`, tema: 'claro', espera: 1400 },
  { arquivo: 'setores.png', url: `${BASE}/#/setores`, tema: 'claro', espera: 1400 },
  { arquivo: 'inicio-escuro.png', url: `${BASE}/#/`, tema: 'escuro', espera: 2600 },
]

/** launch normal; se falhar, Chrome por CLI + connect (fallback desta máquina). */
async function abrirNavegador() {
  try {
    const browser = await puppeteer.launch({ executablePath: navegador, headless: true, args: ['--no-first-run'] })
    return { browser, fechar: () => browser.close() }
  } catch (erro) {
    console.warn(`launch falhou (${erro.message.split('\n')[0]}) — tentando CLI + connect`)
  }

  const porta = 9222
  const perfil = mkdtempSync(join(tmpdir(), 'shots-'))
  const processo = spawn(
    navegador,
    ['--headless=new', `--remote-debugging-port=${porta}`, `--user-data-dir=${perfil}`, '--no-first-run'],
    { stdio: 'ignore' },
  )
  const browser = await conectar(porta)
  return {
    browser,
    fechar: async () => {
      await browser.disconnect()
      processo.kill()
      rmSync(perfil, { recursive: true, force: true })
    },
  }
}

async function conectar(porta) {
  for (let tentativa = 0; tentativa < 40; tentativa++) {
    try {
      return await puppeteer.connect({ browserURL: `http://127.0.0.1:${porta}` })
    } catch {
      await new Promise((r) => setTimeout(r, 250))
    }
  }
  throw new Error(`não consegui conectar ao navegador na porta ${porta}`)
}

const { browser, fechar } = await abrirNavegador()

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

await fechar()
console.log('capturas em', DESTINO)
