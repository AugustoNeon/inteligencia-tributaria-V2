/**
 * Gera src/data/brasilUfPaths.ts a partir da malha oficial de UFs do IBGE.
 *
 * Fonte: API de malhas territoriais v3 do IBGE (qualidade "minima"):
 *   https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=minima
 *
 * Uso: node scripts/gera-mapa-brasil.mjs [caminho-geojson-local]
 * (sem argumento, baixa direto da API)
 *
 * Projeção equiretangular com correção de aspecto na latitude média —
 * suficiente para um mapa-instrumento; ilhas oceânicas distantes
 * (Fernando de Noronha, Trindade, Atol das Rocas) ficam de fora para
 * não esticar o quadro.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const RAIZ = resolve(dirname(fileURLToPath(import.meta.url)), '..')
const DESTINO = resolve(RAIZ, 'src', 'data', 'brasilUfPaths.ts')
const API =
  'https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=application/vnd.geo+json&intrarregiao=UF&qualidade=minima'

/** código IBGE → sigla e nome */
const UFS = {
  11: ['RO', 'Rondônia'], 12: ['AC', 'Acre'], 13: ['AM', 'Amazonas'], 14: ['RR', 'Roraima'],
  15: ['PA', 'Pará'], 16: ['AP', 'Amapá'], 17: ['TO', 'Tocantins'], 21: ['MA', 'Maranhão'],
  22: ['PI', 'Piauí'], 23: ['CE', 'Ceará'], 24: ['RN', 'Rio Grande do Norte'], 25: ['PB', 'Paraíba'],
  26: ['PE', 'Pernambuco'], 27: ['AL', 'Alagoas'], 28: ['SE', 'Sergipe'], 29: ['BA', 'Bahia'],
  31: ['MG', 'Minas Gerais'], 32: ['ES', 'Espírito Santo'], 33: ['RJ', 'Rio de Janeiro'], 35: ['SP', 'São Paulo'],
  41: ['PR', 'Paraná'], 42: ['SC', 'Santa Catarina'], 43: ['RS', 'Rio Grande do Sul'],
  50: ['MS', 'Mato Grosso do Sul'], 51: ['MT', 'Mato Grosso'], 52: ['GO', 'Goiás'], 53: ['DF', 'Distrito Federal'],
}

const LARGURA = 460
// ilhas oceânicas: qualquer anel inteiramente a leste deste meridiano sai
const LON_CORTE = -34.6
// anéis menores que isto (graus²) são ruído costeiro
const AREA_MINIMA = 0.005

const origem = process.argv[2]
const geojson = origem
  ? JSON.parse(readFileSync(origem, 'utf8'))
  : await (await fetch(API)).json()

/** anéis de um Polygon/MultiPolygon, achatados */
function aneis(geom) {
  if (geom.type === 'Polygon') return geom.coordinates
  return geom.coordinates.flat()
}

function bbox(anel) {
  let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity
  for (const [x, y] of anel) {
    if (x < x0) x0 = x
    if (x > x1) x1 = x
    if (y < y0) y0 = y
    if (y > y1) y1 = y
  }
  return { x0, x1, y0, y1 }
}

/** área (graus², shoelace) e centroide do anel */
function areaCentroide(anel) {
  let a = 0, cx = 0, cy = 0
  for (let i = 0; i < anel.length - 1; i++) {
    const [x0, y0] = anel[i]
    const [x1, y1] = anel[i + 1]
    const f = x0 * y1 - x1 * y0
    a += f
    cx += (x0 + x1) * f
    cy += (y0 + y1) * f
  }
  a /= 2
  return { area: Math.abs(a), cx: cx / (6 * a), cy: cy / (6 * a) }
}

// 1) filtra anéis por UF
const porUf = []
for (const feat of geojson.features) {
  const [uf, nome] = UFS[Number(feat.properties.codarea)]
  const mantidos = aneis(feat.geometry).filter((anel) => {
    const b = bbox(anel)
    if (b.x0 > LON_CORTE) return false // ilha oceânica distante
    return areaCentroide(anel).area >= AREA_MINIMA
  })
  porUf.push({ uf, nome, aneis: mantidos })
}

// 2) projeção sobre o conjunto filtrado
let lonMin = Infinity, lonMax = -Infinity, latMin = Infinity, latMax = -Infinity
for (const { aneis: rs } of porUf)
  for (const anel of rs)
    for (const [lon, lat] of anel) {
      if (lon < lonMin) lonMin = lon
      if (lon > lonMax) lonMax = lon
      if (lat < latMin) latMin = lat
      if (lat > latMax) latMax = lat
    }

const kx = Math.cos((((latMin + latMax) / 2) * Math.PI) / 180)
const escala = LARGURA / ((lonMax - lonMin) * kx)
const ALTURA = Math.ceil((latMax - latMin) * escala)
const px = (lon) => (lon - lonMin) * kx * escala
const py = (lat) => (latMax - lat) * escala

// 3) paths compactos (M x y x y … Z; pares subsequentes são LineTo implícito)
function pathDoAnel(anel) {
  const pontos = []
  let ux, uy
  for (const [lon, lat] of anel) {
    const x = Math.round(px(lon) * 10) / 10
    const y = Math.round(py(lat) * 10) / 10
    if (x === ux && y === uy) continue
    pontos.push(`${x} ${y}`)
    ux = x
    uy = y
  }
  return `M${pontos.join(' ')}Z`
}

const saida = porUf.map(({ uf, nome, aneis: rs }) => {
  const maior = rs.reduce((m, r) => (areaCentroide(r).area > areaCentroide(m).area ? r : m))
  const { cx, cy } = areaCentroide(maior)
  return {
    uf,
    nome,
    d: rs.map(pathDoAnel).join(''),
    rotuloX: Math.round(px(cx) * 10) / 10,
    rotuloY: Math.round(py(cy) * 10) / 10,
  }
})

const ts = `/**
 * Contornos das 27 UFs em coordenadas SVG — GERADO por scripts/gera-mapa-brasil.mjs.
 * Fonte: malha territorial oficial do IBGE (API de malhas v3, qualidade mínima),
 * projeção equiretangular; ilhas oceânicas distantes omitidas. Não editar à mão.
 */

export interface UfPath {
  uf: string
  nome: string
  /** contorno em coordenadas do viewBox (pode ter mais de um anel) */
  d: string
  /** posição sugerida do rótulo (centroide do anel principal) */
  rotuloX: number
  rotuloY: number
}

export const MAPA_LARGURA = ${LARGURA}
export const MAPA_ALTURA = ${ALTURA}

export const BRASIL_UFS: UfPath[] = [
${saida
  .map(
    (s) =>
      `  { uf: '${s.uf}', nome: '${s.nome}', rotuloX: ${s.rotuloX}, rotuloY: ${s.rotuloY}, d: '${s.d}' },`,
  )
  .join('\n')}
]
`

writeFileSync(DESTINO, ts)
const kb = (ts.length / 1024).toFixed(1)
console.log(`ok: ${DESTINO} (${kb} KB, viewBox 0 0 ${LARGURA} ${ALTURA})`)
