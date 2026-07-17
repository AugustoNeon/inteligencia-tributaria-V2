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
import { ICMS_UF, UF_PADRAO, icmsDaUf } from '../data/icmsUf'
import { ANOS_SIMULAVEIS } from '../data/transicao'
import { comparar } from '../lib/engine'
import { brl, pct } from '../lib/format'

export interface ResultadoFerramenta {
  /** o que volta ao modelo como tool_result */
  texto: string
  /** hash de navegação (ex.: "#/calculadora?...") quando a tela deve abrir */
  url?: string
}

export function executarFerramenta(nome: string, input: Record<string, unknown>): ResultadoFerramenta {
  if (nome === 'abrir_calculadora') return abrirCalculadora(input)
  return { texto: `Ferramenta desconhecida: ${nome}. Responda sem ferramenta.` }
}

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
