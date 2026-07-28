/**
 * Os mini-formulários que a IA pode abrir dentro do chat.
 *
 * Quando ela oferece "posso incluir suas despesas?", o visitante não deveria
 * ter que digitar oito valores em prosa — nem a IA deveria transcrevê-los
 * (é onde um modelo erra). O convite abre um formulário com os campos exatos
 * da ferramenta; ao enviar, o próprio navegador executa a ferramenta com os
 * números tal como foram digitados.
 *
 * Cada campo carrega o nome da propriedade da ferramenta correspondente
 * (worker/index.ts), então montar a entrada é só reagrupar os valores.
 */

import { CATEGORIAS } from '../data/categorias'
import { CESTA_PADRAO } from '../data/cesta'
import { SALARIO_MINIMO_PADRAO } from '../data/cashback'
import { ICMS_UF, UF_PADRAO } from '../data/icmsUf'
import { ANOS_SIMULAVEIS } from '../data/transicao'
import { brl } from '../lib/format'
import { executarFerramenta, type CartaoFerramenta } from './ferramentas'

export type IdFormulario = 'calculadora' | 'cesta' | 'cashback' | 'raio-x'

export type CampoIa =
  | { tipo: 'numero'; id: string; rotulo: string; prefixo?: string; padrao: number; passo?: number }
  | { tipo: 'escolha'; id: string; rotulo: string; opcoes: { valor: string; rotulo: string }[]; padrao: string }
  | { tipo: 'simNao'; id: string; rotulo: string; padrao: boolean }

export interface EspecFormulario {
  id: IdFormulario
  /** cabeçalho do cartão de formulário */
  titulo: string
  /** uma linha explicando o que sai disso */
  resumo: string
  /** ferramenta de ferramentas.ts que recebe os valores */
  ferramenta: string
  /** rótulo do botão de envio */
  acao: string
  campos: CampoIa[]
}

export type ValoresForm = Record<string, string | number | boolean>

const OPCOES_UF = ICMS_UF.map((u) => ({ valor: u.uf, rotulo: `${u.uf} — ${u.nome}` }))
const OPCOES_ANO = ANOS_SIMULAVEIS.map((a) => ({ valor: String(a), rotulo: a === 2033 ? '2033 (sistema pleno)' : String(a) }))
const OPCOES_CATEGORIA = CATEGORIAS.map((c) => ({ valor: c.id, rotulo: c.rotulo }))

/** o id da prop na ferramenta abrir_cesta (sem hífen) para cada item da cesta */
const PROP_CESTA: Record<string, string> = {
  'cesta-basica': 'cesta_basica',
  'alimentos-gerais': 'alimentos_gerais',
  'produto-padrao': 'produto_padrao',
  medicamentos: 'medicamentos',
  saude: 'saude',
  educacao: 'educacao',
  'transporte-coletivo': 'transporte_coletivo',
  'servico-padrao': 'servico_padrao',
}

const CAMPOS_FAMILIA: CampoIa[] = [
  { tipo: 'numero', id: 'pessoas', rotulo: 'Pessoas na casa', padrao: 4 },
  { tipo: 'numero', id: 'renda', rotulo: 'Renda do mês (todos juntos)', prefixo: 'R$', padrao: 2800, passo: 50 },
  { tipo: 'simNao', id: 'cadunico', rotulo: 'A família está no CadÚnico?', padrao: true },
]

export const FORMULARIOS: Record<IdFormulario, EspecFormulario> = {
  cesta: {
    id: 'cesta',
    titulo: 'Suas despesas do mês',
    resumo: 'Compara o que a família paga de imposto embutido hoje e no ano escolhido.',
    ferramenta: 'abrir_cesta',
    acao: 'Calcular minha cesta',
    campos: [
      ...CESTA_PADRAO.map(
        (item): CampoIa => ({
          tipo: 'numero',
          id: PROP_CESTA[item.categoriaId],
          rotulo: item.rotulo,
          prefixo: 'R$',
          padrao: item.valorPadrao,
          passo: 10,
        }),
      ),
      { tipo: 'escolha', id: 'uf', rotulo: 'Seu estado', opcoes: OPCOES_UF, padrao: UF_PADRAO },
      { tipo: 'escolha', id: 'ano', rotulo: 'Comparar com o ano', opcoes: OPCOES_ANO, padrao: '2033' },
    ],
  },

  cashback: {
    id: 'cashback',
    titulo: 'Sua família e o cashback',
    resumo: 'Verifica a elegibilidade e estima a devolução mensal de CBS e IBS.',
    ferramenta: 'abrir_cashback',
    acao: 'Ver minha devolução',
    campos: [
      ...CAMPOS_FAMILIA,
      { tipo: 'numero', id: 'energia', rotulo: 'Conta de luz', prefixo: 'R$', padrao: 180, passo: 10 },
      { tipo: 'numero', id: 'agua', rotulo: 'Conta de água', prefixo: 'R$', padrao: 90, passo: 10 },
      { tipo: 'numero', id: 'botijao', rotulo: 'Botijão de gás', prefixo: 'R$', padrao: 110, passo: 10 },
      { tipo: 'numero', id: 'telecom', rotulo: 'Internet e telefone', prefixo: 'R$', padrao: 120, passo: 10 },
      { tipo: 'numero', id: 'demais_compras', rotulo: 'Demais compras do mês', prefixo: 'R$', padrao: 600, passo: 50 },
    ],
  },

  'raio-x': {
    id: 'raio-x',
    titulo: 'O retrato da sua família em 2033',
    resumo: 'Junta o efeito na cesta e o cashback num saldo só: ganha ou perde no fim do mês.',
    ferramenta: 'abrir_raio_x',
    acao: 'Ver meu saldo em 2033',
    campos: [
      ...CAMPOS_FAMILIA,
      { tipo: 'numero', id: 'consumo', rotulo: 'Consumo do mês (tudo que compram)', prefixo: 'R$', padrao: 2240, passo: 50 },
      { tipo: 'escolha', id: 'uf', rotulo: 'Seu estado', opcoes: OPCOES_UF, padrao: UF_PADRAO },
    ],
  },

  calculadora: {
    id: 'calculadora',
    titulo: 'O preço de um item',
    resumo: 'Compara o preço de hoje com o do ano escolhido, pela categoria do produto.',
    ferramenta: 'abrir_calculadora',
    acao: 'Comparar o preço',
    campos: [
      { tipo: 'numero', id: 'preco', rotulo: 'Preço de hoje', prefixo: 'R$', padrao: 300, passo: 10 },
      { tipo: 'escolha', id: 'categoria', rotulo: 'Categoria', opcoes: OPCOES_CATEGORIA, padrao: 'produto-padrao' },
      { tipo: 'escolha', id: 'ano', rotulo: 'Comparar com o ano', opcoes: OPCOES_ANO, padrao: '2033' },
      { tipo: 'escolha', id: 'uf', rotulo: 'Seu estado', opcoes: OPCOES_UF, padrao: UF_PADRAO },
    ],
  },
}

export const ehIdFormulario = (v: string): v is IdFormulario => v in FORMULARIOS

/** Valores iniciais do formulário — os padrões da especificação. */
export function valoresIniciais(spec: EspecFormulario): ValoresForm {
  return Object.fromEntries(spec.campos.map((c) => [c.id, c.padrao]))
}

/**
 * Valores do formulário → entrada da ferramenta. Campos numéricos vão como
 * número, escolhas de ano viram número, o resto passa direto.
 */
export function montarEntrada(spec: EspecFormulario, valores: ValoresForm): Record<string, unknown> {
  const entrada: Record<string, unknown> = {}
  for (const campo of spec.campos) {
    const v = valores[campo.id]
    entrada[campo.id] = campo.id === 'ano' ? Number(v) : campo.tipo === 'numero' ? Number(v) : v
  }
  // abrir_cesta exige um perfil de partida; as 8 categorias do formulário o sobrescrevem por inteiro
  if (spec.id === 'cesta') entrada.perfil = 'familiar'
  if (spec.id === 'cashback' || spec.id === 'raio-x') entrada.salario_minimo = SALARIO_MINIMO_PADRAO
  return entrada
}

/** Como o envio do formulário aparece no chat — a fala que o visitante teria digitado. */
export function frasePedido(spec: EspecFormulario, valores: ValoresForm): string {
  const partes = spec.campos.map((campo) => {
    const v = valores[campo.id]
    if (campo.tipo === 'simNao') return `${campo.rotulo} ${v ? 'sim' : 'não'}`
    if (campo.tipo === 'escolha') return `${campo.rotulo}: ${v}`
    return `${campo.rotulo}: ${campo.prefixo === 'R$' ? brl(Number(v)) : v}`
  })
  return `${spec.titulo} — ${partes.join('; ')}.`
}

/** Abre o bloco técnico que o modelo lê e o visitante não vê. */
export const MARCA_MOTOR = '[RESULTADO DO MOTOR DO SITE'

export interface EnvioFormulario {
  /** a fala do visitante, como ela aparece no chat */
  fala: string
  /** o que de fato vai ao modelo: a fala mais os números já calculados */
  mensagem: string
  url?: string
  cartao?: CartaoFerramenta
}

/**
 * Roda a ferramenta com os valores digitados, aqui mesmo no navegador.
 *
 * Poderia-se mandar a fala ao modelo e deixar que ele chamasse a ferramenta,
 * mas isso custa uma ida e volta a mais e abre espaço para ele transcrever um
 * número errado. Como o visitante já entregou os valores em campos tipados,
 * calcular direto é mais barato e mais fiel: ao modelo cabe só interpretar.
 */
export function executarFormulario(spec: EspecFormulario, valores: ValoresForm): EnvioFormulario {
  const r = executarFerramenta(spec.ferramenta, montarEntrada(spec, valores))
  const fala = frasePedido(spec, valores)
  return {
    fala,
    mensagem: `${fala}\n\n${MARCA_MOTOR} — a tela já está aberta e preenchida: ${r.texto}]`,
    url: r.url,
    cartao: r.cartao,
  }
}

/** Esconde do visitante o bloco técnico que só interessa ao modelo. */
export function falaVisivel(texto: string): string {
  const corte = texto.indexOf(MARCA_MOTOR)
  return corte === -1 ? texto : texto.slice(0, corte).trim()
}
