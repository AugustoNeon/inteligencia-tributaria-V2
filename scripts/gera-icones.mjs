/**
 * Gera os ícones PNG da PWA (public/icone-*.png) a partir da arte do favicon.
 * Usa o Chrome headless por CLI (nesta máquina o Edge headless está quebrado
 * e o puppeteer não consegue dar launch — ver README dos scripts).
 * Uso: node scripts/gera-icones.mjs [caminho-do-chrome]
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join, resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')

const CANDIDATOS = [
  process.argv[2],
  String.raw`C:\Program Files\Google\Chrome\Application\chrome.exe`,
  String.raw`C:\Program Files (x86)\Google\Chrome\Application\chrome.exe`,
  '/usr/bin/google-chrome',
].filter(Boolean)
const chrome = CANDIDATOS.find((p) => existsSync(p))
if (!chrome) {
  console.error('Chrome não encontrado — passe o caminho do executável como argumento.')
  process.exit(1)
}

// a arte do favicon.svg, parametrizada p/ os dois recortes
const arte = (miolo) => `<!doctype html>
<meta charset="utf-8">
<style>html,body{margin:0;width:100%;height:100%}svg{display:block;width:100%;height:100%}</style>
${miolo}`

// ícone comum: a arte completa (cantos arredondados próprios, fundo transparente)
const ICONE = arte(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="14" fill="#12333d"/>
  <path d="M20 44 L44 20" stroke="#e8f4f8" stroke-width="5" stroke-linecap="round"/>
  <circle cx="23" cy="23" r="6.5" fill="none" stroke="#3cb5cd" stroke-width="5"/>
  <circle cx="41" cy="41" r="6.5" fill="none" stroke="#c2622a" stroke-width="5"/>
</svg>`)

// maskable: fundo petróleo sangrado até a borda, glifo na zona segura (80%)
const MASKABLE = arte(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" fill="#12333d"/>
  <g transform="translate(32 32) scale(0.72) translate(-32 -32)">
    <path d="M20 44 L44 20" stroke="#e8f4f8" stroke-width="5" stroke-linecap="round"/>
    <circle cx="23" cy="23" r="6.5" fill="none" stroke="#3cb5cd" stroke-width="5"/>
    <circle cx="41" cy="41" r="6.5" fill="none" stroke="#c2622a" stroke-width="5"/>
  </g>
</svg>`)

// janelas menores que ~500px saem corrompidas no Chrome headless — o 192
// é capturado numa janela de 512 com device-scale-factor de 0,375
const ALVOS = [
  { arquivo: 'icone-192.png', html: ICONE, janela: 512, escala: 0.375, fundo: '00000000' },
  { arquivo: 'icone-512.png', html: ICONE, janela: 512, escala: 1, fundo: '00000000' },
  { arquivo: 'icone-maskable-512.png', html: MASKABLE, janela: 512, escala: 1, fundo: 'FF12333D' },
]

const tmp = mkdtempSync(join(tmpdir(), 'icones-'))
try {
  for (const alvo of ALVOS) {
    const pagina = join(tmp, alvo.arquivo.replace('.png', '.html'))
    writeFileSync(pagina, alvo.html)
    const destino = resolve(RAIZ, 'public', alvo.arquivo)
    execFileSync(chrome, [
      '--headless=new',
      `--screenshot=${destino}`,
      `--window-size=${alvo.janela},${alvo.janela}`,
      `--force-device-scale-factor=${alvo.escala}`,
      `--default-background-color=${alvo.fundo}`,
      '--hide-scrollbars',
      '--no-first-run',
      `--user-data-dir=${join(tmp, 'perfil')}`,
      `file:///${pagina.replace(/\\/g, '/')}`,
    ])
    console.log('ok:', alvo.arquivo)
  }
} finally {
  rmSync(tmp, { recursive: true, force: true })
}
