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
import { compararCredito, opcoesDoVendedor } from '../lib/regime'

export interface LinhaCartao {
  rotulo: string
  valor: string
  /** segunda coluna: carga, peso na renda, o que couber */
  nota?: string
}

/**
 * A mesma simulação, formatada para o cartão que fica no histórico do chat.
 * O texto vai para o modelo; o cartão fica para o visitante — assim o número
 * não se perde quando a conversa rola e a página é trocada.
 */
export interface CartaoFerramenta {
  ferramenta: string
  contexto: string
  linhas: LinhaCartao[]
  destaque: { rotulo: string; valor: string; tom: 'ganho' | 'perda' | 'neutro' }
  url: string
}

export interface ResultadoFerramenta {
  /** o que volta ao modelo como tool_result */
  texto: string
  /** hash de navegação (ex.: "#/calculadora?...") quando a tela deve abrir */
  url?: string
  /** presente sempre que houve simulação de verdade (erro não tem cartão) */
  cartao?: CartaoFerramenta
}

export function executarFerramenta(nome: string, input: Record<string, unknown>): ResultadoFerramenta {
  if (nome === 'abrir_calculadora') return abrirCalculadora(input)
  if (nome === 'abrir_cesta') return abrirCesta(input)
  if (nome === 'abrir_cashback') return abrirCashback(input)
  if (nome === 'abrir_raio_x') return abrirRaioX(input)
  if (nome === 'abrir_regime') return abrirRegime(input)
  return { texto: `Ferramenta desconhecida: ${nome}. Responda sem ferramenta.` }
}

/** −12,34 → "economia de R$ 12,34/mês" · +12,34 → "custo extra de R$ 12,34/mês" */
const deltaMensalTexto = (delta: number) =>
  Math.abs(delta) < 0.005
    ? 'efeito mensal estimado nulo'
    : delta < 0
      ? `economia estimada de ${brl(-delta)} por mês`
      : `custo extra estimado de ${brl(delta)} por mês`

/** delta negativo = sobra dinheiro no bolso da família */
const tomDoDelta = (delta: number): 'ganho' | 'perda' | 'neutro' =>
  Math.abs(delta) < 0.005 ? 'neutro' : delta < 0 ? 'ganho' : 'perda'

/** −12,34 → "− R$ 12,34" · +12,34 → "+ R$ 12,34" */
const brlComSinal = (delta: number) =>
  Math.abs(delta) < 0.005 ? brl(0) : `${delta < 0 ? '−' : '+'} ${brl(Math.abs(delta))}`

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
    cartao: {
      ferramenta: 'Calculadora',
      contexto: `${categoria.rotulo} · ${ano}${categoria.icmsModal ? ` · ${uf}` : ''}`,
      linhas: [
        { rotulo: 'hoje', valor: brl(r.hoje.precoFinal), nota: pct(r.hoje.carga) },
        { rotulo: String(ano), valor: brl(r.novo.precoFinal), nota: pct(r.novo.carga) },
      ],
      destaque: { rotulo: 'no preço', valor: brlComSinal(delta), tom: tomDoDelta(delta) },
      url,
    },
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
  const url = `#/cesta?${q.toString()}`
  return {
    texto:
      `Cesta mensal aberta na tela (orçamento de ${brl(orcamento)}, ICMS de ${uf}).` +
      ` Hoje a família paga ${brl(r.hoje.totalImpostos)} de tributos embutidos; em ${ano}, ${brl(r.novo.totalImpostos)} — ${deltaMensalTexto(r.deltaMensal)} (${brl(Math.abs(r.deltaAnual))} por ano).` +
      (maior ? ` Categoria que mais muda: ${maior.rotulo} (${brl(maior.delta)}/mês).` : ''),
    url,
    cartao: {
      ferramenta: 'Minha cesta',
      contexto: `${brl(orcamento)}/mês · ${uf} · ${ano}`,
      linhas: [
        { rotulo: 'imposto hoje', valor: brl(r.hoje.totalImpostos), nota: 'por mês' },
        { rotulo: `imposto em ${ano}`, valor: brl(r.novo.totalImpostos), nota: 'por mês' },
      ],
      destaque: {
        rotulo: 'no mês',
        valor: brlComSinal(r.deltaMensal),
        tom: tomDoDelta(r.deltaMensal),
      },
      url,
    },
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

  const url = `#/cashback?${q.toString()}`
  return {
    texto: `Simulador de cashback aberto na tela. ${situacao} Lembre: a devolução da CBS começa em 2027 e a do IBS em 2029.`,
    url,
    cartao: {
      ferramenta: 'Cashback',
      contexto: `${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'} · ${brl(renda)}/mês · ${input.cadunico ? 'no CadÚnico' : 'fora do CadÚnico'}`,
      linhas: [
        { rotulo: 'renda por pessoa', valor: brl(r.rendaPerCapita), nota: `limite ${brl(r.limite)}` },
        {
          rotulo: 'situação',
          valor: r.elegivel ? 'elegível' : 'não elegível',
          nota: r.elegivel ? undefined : input.cadunico ? 'renda acima do limite' : 'sem CadÚnico',
        },
      ],
      destaque: r.elegivel
        ? { rotulo: 'devolução', valor: `${brl(r.totalMensal)}/mês`, tom: 'ganho' }
        : { rotulo: 'devolução', valor: 'sem direito', tom: 'neutro' },
      url,
    },
  }
}

/**
 * O outro lado do balcão: onde QUEM VENDE se encaixa no novo sistema. Abre a
 * seção "Para quem vende" da Calculadora — a única do site com campos que o
 * assistente ainda não alcançava.
 */
function abrirRegime(input: Record<string, unknown>): ResultadoFerramenta {
  const receita = Number(input.receita)
  if (!Number.isFinite(receita) || receita < 0 || receita > 1_000_000_000) {
    return { texto: 'Erro: "receita" precisa ser a receita ANUAL do negócio em reais (número maior ou igual a zero).' }
  }

  const categoria = CATEGORIAS.find((c) => c.id === input.categoria) ?? CATEGORIAS.find((c) => c.id === 'produto-padrao')!
  const rural = input.rural === true
  const das = Math.min(numeroOu(input.das, 3), 15)

  // a alíquota efetiva de IVA sai do mesmo motor que a página usa
  const aliquotaIva = comparar(1000, categoria, categoria.atual, 2033).aliquotaIvaEfetiva
  const opcoes = opcoesDoVendedor(receita, rural).filter((o) => o.disponivel)
  const credito = compararCredito(1000, aliquotaIva, das / 100)
  const natural = opcoes[0]

  const q = new URLSearchParams({
    cat: categoria.id,
    ano: '2033',
    rec: String(receita),
    rural: rural ? 'sim' : 'nao',
    das: String(das),
  })
  const url = `#/calculadora?${q.toString()}`

  return {
    texto:
      `Seção "Para quem vende" aberta na tela (receita de ${brl(receita)} por ano${rural ? ', atividade rural' : ''}, categoria ${categoria.rotulo}).` +
      ` Regimes disponíveis: ${opcoes.map((o) => `${o.rotulo} (${o.dentroDoIva ? 'dentro' : 'fora'} do IVA)`).join('; ')}.` +
      ` Enquadramento natural pela receita: ${natural.rotulo}.` +
      ` Numa venda de ${brl(1000)} a cliente PJ, o crédito de CBS/IBS transferido é de ${brl(credito.porDentro)} recolhendo por dentro do DAS (${pct(das / 100)} da receita) contra ${brl(credito.porFora)} no regime regular — diferença de ${brl(credito.diferenca)}.` +
      ` A alíquota efetiva de IVA da categoria é ${pct(aliquotaIva)}.`,
    url,
    cartao: {
      ferramenta: 'Para quem vende',
      contexto: `${brl(receita)}/ano · ${categoria.rotulo}${rural ? ' · rural' : ''}`,
      linhas: [
        { rotulo: 'crédito por dentro do DAS', valor: brl(credito.porDentro), nota: 'p/ R$ 1.000' },
        { rotulo: 'crédito no regime regular', valor: brl(credito.porFora), nota: 'p/ R$ 1.000' },
      ],
      destaque: {
        rotulo: natural.dentroDoIva ? 'enquadramento · dentro do IVA' : 'enquadramento · fora do IVA',
        valor: natural.rotulo,
        tom: 'neutro',
      },
      url,
    },
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

  const url = `#/raio-x?${q.toString()}`
  return {
    texto:
      `Raio-X aberto na tela: retrato do sistema pleno (2033) para consumo mensal de ${brl(consumo)} em ${uf}.` +
      ` Cesta: ${deltaMensalTexto(r.cesta.deltaMensal)}. Cashback: ${r.cashback.elegivel ? `${brl(r.cashback.totalMensal)}/mês de devolução` : 'família não elegível'}.` +
      ` Somando tudo, ${efeito}.`,
    url,
    cartao: {
      ferramenta: 'Raio-X',
      contexto: `sistema pleno · ${pessoas} ${pessoas === 1 ? 'pessoa' : 'pessoas'} · ${brl(consumo)}/mês · ${uf}`,
      linhas: [
        { rotulo: 'efeito na cesta', valor: brlComSinal(r.cesta.deltaMensal), nota: 'por mês' },
        {
          rotulo: 'cashback',
          valor: r.cashback.elegivel ? `− ${brl(r.cashback.totalMensal)}` : 'sem direito',
          nota: 'por mês',
        },
      ],
      destaque: {
        rotulo: 'saldo do mês',
        valor: brlComSinal(r.efeitoLiquidoMensal),
        tom: tomDoDelta(r.efeitoLiquidoMensal),
      },
      url,
    },
  }
}
