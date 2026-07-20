/**
 * Execução (lado do navegador) das ferramentas que a IA pode chamar.
 *
 * Princípio central: a IA NUNCA faz conta. Ela escolhe os parâmetros; quem
 * calcula é o mesmo motor testado da Calculadora (lib/engine). O resultado
 * volta ao modelo como texto, e a `url` permite ao chat navegar até a
 * simulação preenchida — o usuário vê a calculadora responder na tela.
 *
 * Este módulo é puro (sem window) para ser testável; a navegação em si
 * acontece no cliente do chat.
 */

import { CATEGORIAS } from '../data/categorias'
import { CESTA_PADRAO, PERFIS_CESTA } from '../data/cesta'
import { SALARIO_MINIMO_PADRAO } from '../data/cashback'
import { ICMS_UF, UF_PADRAO, icmsDaUf } from '../data/icmsUf'
import { ANOS_SIMULAVEIS } from '../data/transicao'
import { calcularCashback } from '../lib/cashback'
import { simularCesta } from '../lib/cesta-mensal'
import { comparar } from '../lib/engine'
import { brl, pct } from '../lib/format'
import { simularPainel } from '../lib/painel'

export interface ResultadoFerramenta {
  /** o que volta ao modelo como tool_result */
  texto: string
  /** hash de navegação (ex.: "#/calculadora?...") quando a tela deve abrir */
  url?: string
}

export function executarFerramenta(nome: string, input: Record<string, unknown>): ResultadoFerramenta {
  if (nome === 'abrir_calculadora') return abrirCalculadora(input)
  if (nome === 'abrir_cesta') return abrirCesta(input)
  if (nome === 'abrir_cashback') return abrirCashback(input)
  if (nome === 'abrir_raio_x') return abrirRaioX(input)
  return { texto: `Ferramenta desconhecida: ${nome}. Responda sem ferramenta.` }
}

/** −12,34 → "economia de R$ 12,34/mês" · +12,34 → "custo extra de R$ 12,34/mês" */
const deltaMensalTexto = (delta: number) =>
  Math.abs(delta) < 0.005
    ? 'efeito mensal estimado nulo'
    : delta < 0
      ? `economia estimada de ${brl(-delta)} por mês`
      : `custo extra estimado de ${brl(delta)} por mês`

const numeroOu = (v: unknown, padrao: number) => {
  const n = Number(v)
  return v !== undefined && v !== null && Number.isFinite(n) && n >= 0 ? n : padrao
}

const ufValida = (v: unknown) => (typeof v === 'string' && ICMS_UF.some((u) => u.uf === v) ? v : UF_PADRAO)

function abrirCalculadora(input: Record<string, unknown>): ResultadoFerramenta {
  const preco = Number(input.preco)
  if (!Number.isFinite(preco) || preco <= 0 || preco > 100_000_000) {
    return { texto: 'Erro: "preco" precisa ser um número em reais maior que zero.' }
  }

  const categoria = CATEGORIAS.find((c) => c.id === input.categoria)
  if (!categoria) {
    return {
      texto: `Erro: categoria "${String(input.categoria)}" não existe. Use um destes ids: ${CATEGORIAS.map((c) => c.id).join(', ')}.`,
    }
  }

  const ano = Number(input.ano)
  if (!ANOS_SIMULAVEIS.includes(ano)) {
    return { texto: `Erro: "ano" precisa ser um destes: ${ANOS_SIMULAVEIS.join(', ')}.` }
  }

  const uf = typeof input.uf === 'string' && ICMS_UF.some((u) => u.uf === input.uf) ? input.uf : UF_PADRAO

  // mesmo perfil que a página monta: ICMS modal segue o estado escolhido
  const perfil = categoria.icmsModal ? { ...categoria.atual, icms: icmsDaUf(uf).aliquota } : categoria.atual
  const r = comparar(preco, categoria, perfil, ano)

  const q = new URLSearchParams({ preco: String(preco), cat: categoria.id, ano: String(ano) })
  if (categoria.icmsModal) q.set('uf', uf)
  const url = `#/calculadora?${q.toString()}`

  const delta = r.novo.precoFinal - r.hoje.precoFinal
  const deltaTexto =
    Math.abs(delta) < 0.005
      ? 'preço estimado não muda'
      : delta < 0
        ? `fica ${brl(-delta)} mais barato`
        : `fica ${brl(delta)} mais caro`

  const notaAnoTeste = r.novo.anoTeste
    ? ' Atenção: 2026 é ano-teste (destaque compensável de 0,9% + 0,1%), a carga não muda.'
    : ''
  const notaUf = categoria.icmsModal ? ` ICMS de ${uf} (${pct(icmsDaUf(uf).aliquota)}).` : ''

  return {
    texto:
      `Simulação aberta na tela do usuário (categoria ${categoria.rotulo}).` +
      ` Hoje: ${brl(r.hoje.precoFinal)}, carga de ${pct(r.hoje.carga)} do preço em tributos.` +
      ` ${r.novo.rotulo}: ${brl(r.novo.precoFinal)}, carga de ${pct(r.novo.carga)} — ${deltaTexto}.` +
      ` Alíquota efetiva do IVA para a categoria: ${pct(r.aliquotaIvaEfetiva)}.` +
      notaUf +
      notaAnoTeste,
    url,
  }
}

/** props do schema (sem hífen) → categoriaId da cesta */
const PROP_PARA_CATEGORIA: Record<string, string> = {
  cesta_basica: 'cesta-basica',
  alimentos_gerais: 'alimentos-gerais',
  produto_padrao: 'produto-padrao',
  medicamentos: 'medicamentos',
  saude: 'saude',
  educacao: 'educacao',
  transporte_coletivo: 'transporte-coletivo',
  servico_padrao: 'servico-padrao',
}

function abrirCesta(input: Record<string, unknown>): ResultadoFerramenta {
  const ano = Number(input.ano)
  if (!ANOS_SIMULAVEIS.includes(ano)) {
    return { texto: `Erro: "ano" precisa ser um destes: ${ANOS_SIMULAVEIS.join(', ')}.` }
  }
  const uf = ufValida(input.uf)

  // base: perfil pedido (ou o "familiar", que são os valores padrão da página)
  const perfil = PERFIS_CESTA.find((p) => p.id === input.perfil) ?? PERFIS_CESTA.find((p) => p.id === 'familiar')!
  const valores: Record<string, number> = { ...perfil.valores }
  // valores por categoria por cima do perfil
  for (const [prop, categoriaId] of Object.entries(PROP_PARA_CATEGORIA)) {
    if (input[prop] !== undefined) valores[categoriaId] = numeroOu(input[prop], valores[categoriaId] ?? 0)
  }

  const itens = CESTA_PADRAO.map((i) => ({ categoriaId: i.categoriaId, rotulo: i.rotulo, valor: valores[i.categoriaId] ?? 0 }))
  const orcamento = itens.reduce((s, i) => s + i.valor, 0)
  if (orcamento <= 0) return { texto: 'Erro: a cesta ficou vazia — informe um perfil ou valores maiores que zero.' }
  const r = simularCesta(itens, uf, ano)

  const q = new URLSearchParams({ uf, ano: String(ano) })
  for (const item of itens) q.set(item.categoriaId, String(item.valor))

  const maior = [...r.linhas].sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta))[0]
  return {
    texto:
      `Cesta mensal aberta na tela (orçamento de ${brl(orcamento)}, ICMS de ${uf}).` +
      ` Hoje a família paga ${brl(r.hoje.totalImpostos)} de tributos embutidos; em ${ano}, ${brl(r.novo.totalImpostos)} — ${deltaMensalTexto(r.deltaMensal)} (${brl(Math.abs(r.deltaAnual))} por ano).` +
      (maior ? ` Categoria que mais muda: ${maior.rotulo} (${brl(maior.delta)}/mês).` : ''),
    url: `#/cesta?${q.toString()}`,
  }
}

function abrirCashback(input: Record<string, unknown>): ResultadoFerramenta {
  const pessoas = Math.max(1, Math.round(numeroOu(input.pessoas, 4)))
  const renda = numeroOu(input.renda, 2800)
  if (typeof input.cadunico !== 'boolean') {
    return { texto: 'Erro: informe "cadunico" (true/false) — a elegibilidade depende da inscrição no CadÚnico.' }
  }
  const salarioMinimo = numeroOu(input.salario_minimo, SALARIO_MINIMO_PADRAO)
  const gastos = {
    energia: numeroOu(input.energia, 180),
    agua: numeroOu(input.agua, 90),
    'gas-encanado': numeroOu(input.gas_encanado, 0),
    botijao: numeroOu(input.botijao, 110),
    telecom: numeroOu(input.telecom, 120),
  }
  const demais = numeroOu(input.demais_compras, 600)

  const r = calcularCashback({
    pessoas,
    rendaFamiliar: renda,
    inscritoCadUnico: input.cadunico,
    salarioMinimo,
    gastos,
    demaisCompras: demais,
  })

  const q = new URLSearchParams({
    pe: String(pessoas),
    renda: String(renda),
    cad: input.cadunico ? 'sim' : 'nao',
    sm: String(salarioMinimo),
    en: String(gastos.energia),
    ag: String(gastos.agua),
    gn: String(gastos['gas-encanado']),
    bo: String(gastos.botijao),
    te: String(gastos.telecom),
    de: String(demais),
  })

  const situacao = r.elegivel
    ? `A família é elegível (renda por pessoa de ${brl(r.rendaPerCapita)}, dentro do limite de ${brl(r.limite)} = meio salário mínimo). Devolução estimada: ${brl(r.totalMensal)} por mês (${brl(r.totalAnual)} por ano), o equivalente a ${pct(r.pesoNaRenda)} da renda familiar.`
    : input.cadunico
      ? `A família NÃO é elegível: a renda por pessoa (${brl(r.rendaPerCapita)}) passa do limite de meio salário mínimo (${brl(r.limite)}).`
      : `A família NÃO é elegível porque não está inscrita no CadÚnico — esse é um requisito obrigatório, além da renda por pessoa de até meio salário mínimo.`

  return {
    texto: `Simulador de cashback aberto na tela. ${situacao} Lembre: a devolução da CBS começa em 2027 e a do IBS em 2029.`,
    url: `#/cashback?${q.toString()}`,
  }
}

function abrirRaioX(input: Record<string, unknown>): ResultadoFerramenta {
  const pessoas = Math.max(1, Math.round(numeroOu(input.pessoas, 4)))
  const renda = numeroOu(input.renda, 2800)
  if (typeof input.cadunico !== 'boolean') {
    return { texto: 'Erro: informe "cadunico" (true/false) — o cashback do retrato depende disso.' }
  }
  const uf = ufValida(input.uf)
  const salarioMinimo = numeroOu(input.salario_minimo, SALARIO_MINIMO_PADRAO)
  // mesmo fallback da página: consumo pré-preenchido como 80% da renda
  const consumo = numeroOu(input.consumo, Math.round(renda * 0.8))
  if (consumo <= 0) return { texto: 'Erro: "consumo" precisa ser maior que zero.' }

  const r = simularPainel({
    pessoas,
    rendaFamiliar: renda,
    inscritoCadUnico: input.cadunico,
    consumo,
    uf,
    salarioMinimo,
  })

  const q = new URLSearchParams({
    pe: String(pessoas),
    renda: String(renda),
    cad: input.cadunico ? 'sim' : 'nao',
    uf,
    cons: String(consumo),
    sm: String(salarioMinimo),
  })

  const efeito =
    Math.abs(r.efeitoLiquidoMensal) < 0.005
      ? 'efeito líquido praticamente nulo'
      : r.efeitoLiquidoMensal < 0
        ? `a família tende a SAIR GANHANDO ${brl(-r.efeitoLiquidoMensal)} por mês (${brl(-r.efeitoLiquidoAnual)} por ano)`
        : `a família tende a pagar ${brl(r.efeitoLiquidoMensal)} a mais por mês (${brl(r.efeitoLiquidoAnual)} por ano)`

  return {
    texto:
      `Raio-X aberto na tela: retrato do sistema pleno (2033) para consumo mensal de ${brl(consumo)} em ${uf}.` +
      ` Cesta: ${deltaMensalTexto(r.cesta.deltaMensal)}. Cashback: ${r.cashback.elegivel ? `${brl(r.cashback.totalMensal)}/mês de devolução` : 'família não elegível'}.` +
      ` Somando tudo, ${efeito}.`,
    url: `#/raio-x?${q.toString()}`,
  }
}
