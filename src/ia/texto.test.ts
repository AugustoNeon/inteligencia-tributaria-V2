import { describe, expect, it } from 'vitest'
import { analisarLinha, analisarTexto } from './texto'

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
