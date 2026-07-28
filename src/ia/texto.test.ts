import { describe, expect, it } from 'vitest'
import { analisarLinha, analisarTexto, separarPalavras } from './texto'

describe('analisarLinha', () => {
  it('marca negrito e devolve o texto sem os asteriscos', () => {
    const t = analisarLinha('a família **sai ganhando** no fim')
    expect(t.map((x) => x.valor).join('')).toBe('a família sai ganhando no fim')
    expect(t.find((x) => x.forte)?.valor).toBe('sai ganhando')
  })

  it('reconhece reais e percentuais como dado', () => {
    const dados = analisarLinha('de R$ 1.234,56 hoje para 26,5% em 2033').filter((t) => t.dado)
    expect(dados.map((d) => d.valor)).toEqual(['R$ 1.234,56', '26,5%'])
  })

  it('pega o sinal colado no valor', () => {
    expect(analisarLinha('efeito de −R$ 2,60').filter((t) => t.dado)[0].valor).toBe('−R$ 2,60')
  })

  it('ano solto não vira dado (só R$ e %)', () => {
    expect(analisarLinha('a partir de 2033').some((t) => t.dado)).toBe(false)
  })

  it('valor dentro de negrito acumula as duas marcas', () => {
    const t = analisarLinha('economia de **R$ 2,60** por mês')
    const forte = t.find((x) => x.forte)!
    expect(forte.valor).toBe('R$ 2,60')
    expect(forte.dado).toBe(true)
  })
})

describe('negrito ainda chegando (fluxo)', () => {
  it('marca aberta não vaza para a tela: o trecho já nasce forte', () => {
    const t = analisarLinha('O **cashback é uma devolu')
    expect(t.map((x) => x.valor).join('')).toBe('O cashback é uma devolu')
    expect(t.find((x) => x.forte)?.valor).toBe('cashback é uma devolu')
  })

  it('marca sem nada depois é descartada', () => {
    expect(analisarLinha('O **').map((x) => x.valor).join('')).toBe('O ')
  })

  it('fechado o negrito, o resultado é o mesmo de sempre', () => {
    expect(analisarLinha('O **cashback** devolve')).toEqual(analisarLinha('O **cashback** devolve'))
    expect(analisarLinha('O **cashback** devolve').filter((t) => t.forte)).toHaveLength(1)
  })
})

describe('separarPalavras', () => {
  it('uma unidade por palavra, com o espaço colado atrás', () => {
    expect(separarPalavras(analisarLinha('o imposto cai')).map((t) => t.valor)).toEqual(['o ', 'imposto ', 'cai'])
  })

  it('valor não é partido ao meio e mantém as marcas', () => {
    const p = separarPalavras(analisarLinha('sobra **R$ 1.234,56** por mês'))
    const valor = p.find((t) => t.dado)!
    expect(valor.valor).toBe('R$ 1.234,56')
    expect(valor.forte).toBe(true)
  })

  it('nenhuma unidade nasce vazia (seria uma palavra invisível animando)', () => {
    for (const t of separarPalavras(analisarLinha('  espaços   soltos  aqui '))) {
      expect(t.valor).not.toBe('')
    }
  })

  it('texto que cresce mantém as palavras já escritas na mesma posição', () => {
    const antes = separarPalavras(analisarLinha('Em 2033 o preço'))
    const depois = separarPalavras(analisarLinha('Em 2033 o preço cai'))
    expect(depois.slice(0, antes.length - 1).map((t) => t.valor)).toEqual(antes.slice(0, -1).map((t) => t.valor))
  })
})

describe('analisarTexto', () => {
  it('linha em branco separa parágrafos; quebra solta não', () => {
    const blocos = analisarTexto('primeira linha\nainda a primeira\n\nsegunda')
    expect(blocos).toHaveLength(2)
    expect(blocos[0]).toMatchObject({ tipo: 'paragrafo' })
    expect(blocos[0].tipo === 'paragrafo' && blocos[0].trechos[0].valor).toBe('primeira linha ainda a primeira')
  })

  it('agrupa itens seguidos numa lista só', () => {
    const blocos = analisarTexto('o que muda:\n- o IVA\n- o cashback\n- o split payment')
    expect(blocos.map((b) => b.tipo)).toEqual(['paragrafo', 'lista'])
    expect(blocos[1].tipo === 'lista' && blocos[1].itens).toHaveLength(3)
  })

  it('texto vazio não gera bloco', () => {
    expect(analisarTexto('   \n\n  ')).toEqual([])
  })
})
