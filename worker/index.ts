/**
 * Worker (Cloudflare) do assistente de IA — o único lugar que conhece a
 * chave da API da Anthropic.
 *
 * Rotas:
 *  GET  /status  → { ligada, expira }            (público)
 *  POST /chat    → proxy p/ a API da Claude       (só com a IA ligada)
 *  POST /admin   → liga/desliga com senha + TTL   (interruptor de custo)
 *
 * Controles de custo, nesta ordem: interruptor com auto-desligamento (KV com
 * TTL), limite por IP/hora, teto global por dia, histórico e max_tokens
 * limitados. Desligada, o worker NEM CHAMA a API — custo zero.
 *
 * O briefing (system prompt) é importado do MESMO código do site
 * (src/ia/briefing.ts): atualizou os dados do site, a IA aprende no
 * próximo `wrangler deploy`. Cache de prompt corta ~90% do custo de
 * entrada nas perguntas seguintes.
 */

import Anthropic from '@anthropic-ai/sdk'
import { CATEGORIAS } from '../src/data/categorias'
import { ICMS_UF } from '../src/data/icmsUf'
import { ANOS_SIMULAVEIS } from '../src/data/transicao'
import { montarBriefing } from '../src/ia/briefing'

export interface Env {
  ANTHROPIC_API_KEY: string
  ADMIN_SENHA: string
  IA_KV: KVNamespace
}

const MODELO = 'claude-haiku-4-5'
const MAX_TOKENS_RESPOSTA = 1024
const MAX_MENSAGENS = 24
const MAX_BYTES_CORPO = 60_000
const LIMITE_IP_HORA = 20
const LIMITE_GLOBAL_DIA = 300
const LIMITE_ADMIN_HORA = 8

const ORIGENS_PERMITIDAS = ['https://augustoneon.github.io', 'http://localhost:5173', 'http://localhost:4173']

const BRIEFING = montarBriefing()

const UFS = ICMS_UF.map((u) => u.uf)

const FERRAMENTAS: Anthropic.Messages.Tool[] = [
  {
    name: 'abrir_calculadora',
    description:
      'Abre a Calculadora do site na tela do usuário, preenchida com os parâmetros, e devolve a simulação feita pelo motor oficial (preço hoje vs. preço no ano escolhido). Use SEMPRE que o usuário perguntar quanto UM produto ou serviço custará/mudará em algum ano da transição. Nunca calcule por conta própria.',
    input_schema: {
      type: 'object',
      properties: {
        preco: { type: 'number', description: 'Preço de hoje em reais, com impostos embutidos (ex.: 300)' },
        categoria: {
          type: 'string',
          enum: CATEGORIAS.map((c) => c.id),
          description: 'Id da categoria do produto/serviço (lista e significado no briefing)',
        },
        ano: { type: 'number', enum: ANOS_SIMULAVEIS, description: 'Ano da simulação (2033 = sistema pleno)' },
        uf: { type: 'string', enum: UFS, description: 'Sigla do estado p/ o ICMS atual (opcional; padrão SP)' },
      },
      required: ['preco', 'categoria', 'ano'],
    },
  },
  {
    name: 'abrir_cesta',
    description:
      'Abre a página Minha Cesta preenchida e devolve o efeito da reforma no ORÇAMENTO MENSAL INTEIRO da família (8 categorias de gasto). Use quando a pergunta for sobre o custo de vida mensal/da família, não sobre um item só. Parta de um perfil e sobrescreva só as categorias que o usuário citar.',
    input_schema: {
      type: 'object',
      properties: {
        ano: { type: 'number', enum: ANOS_SIMULAVEIS, description: 'Ano da comparação (2033 = sistema pleno)' },
        perfil: {
          type: 'string',
          enum: ['essencial', 'familiar', 'ampla'],
          description:
            'Ponto de partida: essencial (~R$ 1.300/mês, só o básico), familiar (~R$ 2.680/mês, padrão) ou ampla (~R$ 6.200/mês, pesada em serviços)',
        },
        uf: { type: 'string', enum: UFS, description: 'Estado p/ o ICMS atual (opcional; padrão SP)' },
        cesta_basica: { type: 'number', description: 'R$/mês em mercado: cesta básica (opcional)' },
        alimentos_gerais: { type: 'number', description: 'R$/mês em mercado: outros alimentos (opcional)' },
        produto_padrao: { type: 'number', description: 'R$/mês em vestuário, casa e higiene (opcional)' },
        medicamentos: { type: 'number', description: 'R$/mês em medicamentos (opcional)' },
        saude: { type: 'number', description: 'R$/mês em consultas e exames (opcional)' },
        educacao: { type: 'number', description: 'R$/mês em escola e cursos (opcional)' },
        transporte_coletivo: { type: 'number', description: 'R$/mês em transporte público (opcional)' },
        servico_padrao: { type: 'number', description: 'R$/mês em serviços: academia, salão, lazer (opcional)' },
      },
      required: ['ano', 'perfil'],
    },
  },
  {
    name: 'abrir_cashback',
    description:
      'Abre o simulador de Cashback preenchido e devolve elegibilidade e devolução mensal/anual estimada de CBS/IBS para a família. Use quando o usuário perguntar se tem direito ao cashback ou quanto receberia. Pergunte antes o que faltar: nº de pessoas, renda familiar e se a família está no CadÚnico.',
    input_schema: {
      type: 'object',
      properties: {
        pessoas: { type: 'number', description: 'Pessoas na família' },
        renda: { type: 'number', description: 'Renda familiar mensal total em R$' },
        cadunico: { type: 'boolean', description: 'A família está inscrita no CadÚnico?' },
        energia: { type: 'number', description: 'Conta de luz mensal em R$ (opcional; padrão 180)' },
        agua: { type: 'number', description: 'Conta de água mensal em R$ (opcional; padrão 90)' },
        gas_encanado: { type: 'number', description: 'Gás encanado mensal em R$ (opcional; padrão 0)' },
        botijao: { type: 'number', description: 'Botijão de gás mensal em R$ (opcional; padrão 110)' },
        telecom: { type: 'number', description: 'Internet/telefone mensal em R$ (opcional; padrão 120)' },
        demais_compras: { type: 'number', description: 'Demais compras tributadas no mês em R$ (opcional; padrão 600)' },
        salario_minimo: { type: 'number', description: 'Salário mínimo de referência (opcional)' },
      },
      required: ['pessoas', 'renda', 'cadunico'],
    },
  },
  {
    name: 'abrir_raio_x',
    description:
      'Abre o Raio-X preenchido: o retrato completo da família no sistema pleno (2033) — efeito na cesta MENOS o cashback = efeito líquido no orçamento. Use para perguntas do tipo "no fim das contas, minha família ganha ou perde com a reforma?". Pergunte antes o que faltar: pessoas, renda e CadÚnico.',
    input_schema: {
      type: 'object',
      properties: {
        pessoas: { type: 'number', description: 'Pessoas na família' },
        renda: { type: 'number', description: 'Renda familiar mensal total em R$' },
        cadunico: { type: 'boolean', description: 'A família está inscrita no CadÚnico?' },
        consumo: { type: 'number', description: 'Consumo mensal total em R$ (opcional; padrão = 80% da renda)' },
        uf: { type: 'string', enum: UFS, description: 'Estado (opcional; padrão SP)' },
        salario_minimo: { type: 'number', description: 'Salário mínimo de referência (opcional)' },
      },
      required: ['pessoas', 'renda', 'cadunico'],
    },
  },
]

/* ---------------------------------- infra ---------------------------------- */

function cors(origin: string | null): Record<string, string> {
  const permitida = origin && ORIGENS_PERMITIDAS.includes(origin) ? origin : ORIGENS_PERMITIDAS[0]
  return {
    'Access-Control-Allow-Origin': permitida,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'content-type',
    Vary: 'Origin',
  }
}

function json(dados: unknown, status: number, origin: string | null): Response {
  return new Response(JSON.stringify(dados), {
    status,
    headers: { 'content-type': 'application/json; charset=utf-8', ...cors(origin) },
  })
}

/** Contador com janela em KV. Devolve true se estourou o limite. */
async function estourou(kv: KVNamespace, chave: string, limite: number, ttlSegundos: number): Promise<boolean> {
  const atual = Number((await kv.get(chave)) ?? '0')
  if (atual >= limite) return true
  await kv.put(chave, String(atual + 1), { expirationTtl: ttlSegundos })
  return false
}

async function estadoInterruptor(kv: KVNamespace): Promise<{ ligada: boolean; expira: string | null }> {
  const expira = await kv.get('ia:ligada')
  return { ligada: expira !== null, expira }
}

/* --------------------------------- handlers -------------------------------- */

async function chat(request: Request, env: Env, origin: string | null, ctx: ExecutionContext): Promise<Response> {
  const { ligada } = await estadoInterruptor(env.IA_KV)
  if (!ligada) return json({ erro: 'desligada' }, 503, origin)

  const ip = request.headers.get('CF-Connecting-IP') ?? 'desconhecido'
  const hora = new Date().toISOString().slice(0, 13)
  const dia = hora.slice(0, 10)
  if (await estourou(env.IA_KV, `rl:ip:${ip}:${hora}`, LIMITE_IP_HORA, 3900)) {
    return json({ erro: 'limite-ip' }, 429, origin)
  }
  if (await estourou(env.IA_KV, `rl:global:${dia}`, LIMITE_GLOBAL_DIA, 90_000)) {
    return json({ erro: 'limite-global' }, 429, origin)
  }

  const corpo = await request.text()
  if (corpo.length > MAX_BYTES_CORPO) return json({ erro: 'corpo-grande' }, 413, origin)
  let messages: Anthropic.Messages.MessageParam[]
  try {
    const dados = JSON.parse(corpo) as { messages?: unknown }
    if (!Array.isArray(dados.messages) || dados.messages.length === 0 || dados.messages.length > MAX_MENSAGENS) {
      throw new Error('formato')
    }
    messages = dados.messages as Anthropic.Messages.MessageParam[]
  } catch {
    return json({ erro: 'corpo-invalido' }, 400, origin)
  }

  const anthropic = new Anthropic({ apiKey: env.ANTHROPIC_API_KEY, maxRetries: 1 })

  // A resposta sai como fluxo (SSE) para o texto aparecer sendo escrito, em vez
  // de surgir pronto depois da espera. Só o que a tela precisa atravessa o fio:
  // os pedaços de texto e, no fim, a mensagem remontada.
  const { readable, writable } = new TransformStream()
  const escritor = writable.getWriter()
  const codificador = new TextEncoder()
  const emitir = (evento: unknown) => escritor.write(codificador.encode(`data: ${JSON.stringify(evento)}\n\n`))

  ctx.waitUntil(
    (async () => {
      try {
        const fluxo = anthropic.messages.stream({
          model: MODELO,
          max_tokens: MAX_TOKENS_RESPOSTA,
          system: [{ type: 'text', text: BRIEFING, cache_control: { type: 'ephemeral' } }],
          tools: FERRAMENTAS,
          messages,
        })
        for await (const evento of fluxo) {
          if (evento.type === 'content_block_delta' && evento.delta.type === 'text_delta') {
            await emitir({ tipo: 'texto', delta: evento.delta.text })
          }
        }
        const final = await fluxo.finalMessage()
        await emitir({ tipo: 'fim', content: final.content, stop_reason: final.stop_reason })
      } catch (erro) {
        // o cabeçalho 200 já foi enviado: o erro tem que viajar dentro do fluxo
        await emitir({ tipo: 'erro', status: erro instanceof Anthropic.APIError ? erro.status : null })
      } finally {
        await escritor.close()
      }
    })(),
  )

  return new Response(readable, {
    headers: {
      'content-type': 'text/event-stream; charset=utf-8',
      'cache-control': 'no-cache',
      ...cors(origin),
    },
  })
}

async function admin(request: Request, env: Env, origin: string | null): Promise<Response> {
  const ip = request.headers.get('CF-Connecting-IP') ?? 'desconhecido'
  const hora = new Date().toISOString().slice(0, 13)
  if (await estourou(env.IA_KV, `rl:admin:${ip}:${hora}`, LIMITE_ADMIN_HORA, 3900)) {
    return json({ erro: 'limite' }, 429, origin)
  }

  let dados: { senha?: string; acao?: string; horas?: number }
  try {
    dados = (await request.json()) as typeof dados
  } catch {
    return json({ erro: 'corpo-invalido' }, 400, origin)
  }
  if (!dados.senha || dados.senha !== env.ADMIN_SENHA) return json({ erro: 'senha' }, 401, origin)

  if (dados.acao === 'ligar') {
    const horas = Math.min(Math.max(Number(dados.horas) || 2, 1), 12)
    const expira = new Date(Date.now() + horas * 3_600_000).toISOString()
    await env.IA_KV.put('ia:ligada', expira, { expirationTtl: horas * 3600 })
    return json({ ligada: true, expira }, 200, origin)
  }
  if (dados.acao === 'desligar') {
    await env.IA_KV.delete('ia:ligada')
    return json({ ligada: false, expira: null }, 200, origin)
  }
  return json({ erro: 'acao-invalida' }, 400, origin)
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const origin = request.headers.get('Origin')
    const url = new URL(request.url)

    if (request.method === 'OPTIONS') return new Response(null, { status: 204, headers: cors(origin) })

    if (url.pathname === '/status' && request.method === 'GET') {
      const estado = await estadoInterruptor(env.IA_KV)
      return json(estado, 200, origin)
    }
    if (url.pathname === '/chat' && request.method === 'POST') return chat(request, env, origin, ctx)
    if (url.pathname === '/admin' && request.method === 'POST') return admin(request, env, origin)

    return json({ erro: 'rota' }, 404, origin)
  },
}
