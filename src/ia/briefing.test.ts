import { describe, expect, it } from 'vitest'
import { CATEGORIAS } from '../data/categorias'
import { FONTES } from '../data/fontes'
import { GLOSSARIO } from '../data/glossario'
import { TRANSICAO } from '../data/transicao'
import { montarBriefing } from './briefing'

const briefing = montarBriefing()

describe('montarBriefing', () => {
  it('cobre todos os termos do glossário', () => {
    for (const t of GLOSSARIO) {
      expect(briefing, t.termo).toContain(`${t.termo}: `)
    }
  })

  it('lista o id exato de toda categoria da calculadora (contrato da ferramenta)', () => {
    for (const c of CATEGORIAS) {
      expect(briefing, c.id).toContain(`id "${c.id}"`)
    }
  })

  it('cobre todos os anos da transição e o epílogo de 2078', () => {
    for (const t of TRANSICAO) {
      expect(briefing).toContain(`${t.ano} — ${t.titulo}`)
    }
    expect(briefing).toContain('2078')
  })

  it('cita todas as fontes oficiais pelo título', () => {
    for (const f of FONTES) {
      expect(briefing).toContain(f.titulo)
    }
  })

  it('traz as regras: alíquota de referência, disclaimer e escopo', () => {
    expect(briefing).toContain('26,5%')
    expect(briefing).toContain('ESTIMATIVA DIDÁTICA')
    expect(briefing).toContain('abrir_calculadora')
    expect(briefing).toContain('contador')
  })

  it('cabe no orçamento de contexto (embaixo de 40 KB)', () => {
    expect(briefing.length).toBeGreaterThan(8_000)
    expect(briefing.length).toBeLessThan(40_000)
  })
})
