import { describe, expect, it } from 'vitest'
import { extrairConvites } from './convites'

describe('extrairConvites', () => {
  it('arranca as linhas ::acao e devolve o texto limpo', () => {
    const { texto, convites } = extrairConvites(
      'Em 2033 o tênis fica R$ 297,40.\n::acao cesta | Incluir minhas despesas do mês',
    )
    expect(texto).toBe('Em 2033 o tênis fica R$ 297,40.')
    expect(convites).toEqual([{ formulario: 'cesta', rotulo: 'Incluir minhas despesas do mês' }])
  })

  it('ignora id que não corresponde a formulário (botão morto nunca aparece)', () => {
    const { convites } = extrairConvites('texto\n::acao inventada | Fazer algo impossível')
    expect(convites).toEqual([])
  })

  it('não repete o mesmo formulário e para em dois convites', () => {
    const { convites } = extrairConvites(
      ['resposta', '::acao cesta | A', '::acao cesta | B', '::acao cashback | C', '::acao raio-x | D'].join('\n'),
    )
    expect(convites.map((c) => c.formulario)).toEqual(['cesta', 'cashback'])
  })

  it('linha ainda sendo escrita some do texto sem virar botão', () => {
    // é o que a tela vê no meio do fluxo: a linha existe, o convite ainda não
    for (const meio of ['::acao', '::acao ces', '::acao cesta', '::acao cesta |']) {
      const { texto, convites } = extrairConvites(`Em 2033 fica mais barato.\n${meio}`)
      expect(texto, meio).toBe('Em 2033 fica mais barato.')
      expect(convites, meio).toEqual([])
    }
  })

  it('resposta sem convite atravessa intacta', () => {
    const bruto = 'O split payment separa o imposto no ato do pagamento.'
    expect(extrairConvites(bruto)).toEqual({ texto: bruto, convites: [] })
  })
})
