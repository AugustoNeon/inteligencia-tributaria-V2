import { describe, expect, it } from 'vitest'
import { anoDaTransicao, progressoTransicao, proximoMarco } from './agora'

describe('anoDaTransicao', () => {
  it('devolve o próprio ano dentro da janela 2023–2033', () => {
    expect(anoDaTransicao(new Date(2026, 6, 14))).toBe(2026)
    expect(anoDaTransicao(new Date(2029, 0, 1))).toBe(2029)
  })

  it('faz clamp nas pontas', () => {
    expect(anoDaTransicao(new Date(2020, 5, 1))).toBe(2023)
    expect(anoDaTransicao(new Date(2040, 5, 1))).toBe(2033)
  })
})

describe('proximoMarco', () => {
  it('em julho de 2026 o próximo marco é a virada federal de 2027', () => {
    const r = proximoMarco(new Date(2026, 6, 14))
    expect(r?.marco.ano).toBe(2027)
    expect(r?.dias).toBe(171)
  })

  it('em 2027 o próximo marco é a migração de 2029', () => {
    expect(proximoMarco(new Date(2027, 2, 1))?.marco.ano).toBe(2029)
  })

  it('na véspera da virada falta 1 dia', () => {
    expect(proximoMarco(new Date(2026, 11, 31))?.dias).toBe(1)
  })

  it('depois de 2033 não há marco — sistema pleno', () => {
    expect(proximoMarco(new Date(2033, 0, 1))).toBeNull()
    expect(proximoMarco(new Date(2035, 3, 10))).toBeNull()
  })
})

describe('progressoTransicao', () => {
  it('vale 0 na promulgação da EC 132 e 1 no sistema pleno', () => {
    expect(progressoTransicao(new Date(2023, 11, 20))).toBe(0)
    expect(progressoTransicao(new Date(2033, 0, 1))).toBe(1)
  })

  it('faz clamp fora da janela', () => {
    expect(progressoTransicao(new Date(2023, 0, 1))).toBe(0)
    expect(progressoTransicao(new Date(2040, 0, 1))).toBe(1)
  })

  it('cresce monotonicamente e fica perto de 28% em jul/2026', () => {
    const meio = progressoTransicao(new Date(2026, 6, 14))
    expect(meio).toBeGreaterThan(progressoTransicao(new Date(2025, 6, 14)))
    expect(meio).toBeLessThan(progressoTransicao(new Date(2027, 6, 14)))
    expect(meio).toBeGreaterThan(0.26)
    expect(meio).toBeLessThan(0.31)
  })
})
