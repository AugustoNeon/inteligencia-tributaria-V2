import { describe, expect, it } from 'vitest'
import { comparar } from '../lib/engine'
import { CATEGORIAS } from '../data/categorias'
import { icmsDaUf } from '../data/icmsUf'
import { executarFerramenta } from './ferramentas'

describe('abrir_calculadora', () => {
  it('simula e devolve URL que preenche a calculadora', () => {
    const r = executarFerramenta('abrir_calculadora', { preco: 1000, categoria: 'produto-padrao', ano: 2033, uf: 'SP' })
    expect(r.url).toBe('#/calculadora?preco=1000&cat=produto-padrao&ano=2033&uf=SP')
    expect(r.texto).toContain('R$')
    expect(r.texto).toContain('Sistema pleno (2033)')
  })

  it('os números do texto vêm do motor real (sem conta própria)', () => {
    const categoria = CATEGORIAS.find((c) => c.id === 'produto-padrao')!
    const esperado = comparar(300, categoria, { ...categoria.atual, icms: icmsDaUf('SP').aliquota }, 2030)
    const r = executarFerramenta('abrir_calculadora', { preco: 300, categoria: 'produto-padrao', ano: 2030, uf: 'SP' })
    expect(r.texto).toContain(esperado.novo.precoFinal.toFixed(2).replace('.', ','))
  })

  it('usa o ICMS do estado pedido (MA ≠ SP)', () => {
    const sp = executarFerramenta('abrir_calculadora', { preco: 1000, categoria: 'produto-padrao', ano: 2030, uf: 'SP' })
    const ma = executarFerramenta('abrir_calculadora', { preco: 1000, categoria: 'produto-padrao', ano: 2030, uf: 'MA' })
    expect(sp.texto).not.toBe(ma.texto)
    expect(ma.texto).toContain('ICMS de MA')
  })

  it('sem uf: usa o padrão e ainda navega', () => {
    const r = executarFerramenta('abrir_calculadora', { preco: 500, categoria: 'produto-padrao', ano: 2033 })
    expect(r.url).toContain('uf=SP')
  })

  it('categoria sem ICMS modal não põe uf na URL', () => {
    const r = executarFerramenta('abrir_calculadora', { preco: 250, categoria: 'saude', ano: 2033, uf: 'RJ' })
    expect(r.url).not.toContain('uf=')
  })

  it('erros viram texto corrigível para o modelo, sem URL', () => {
    expect(executarFerramenta('abrir_calculadora', { preco: -5, categoria: 'saude', ano: 2033 }).url).toBeUndefined()
    const catErrada = executarFerramenta('abrir_calculadora', { preco: 100, categoria: 'sapato', ano: 2033 })
    expect(catErrada.url).toBeUndefined()
    expect(catErrada.texto).toContain('produto-padrao')
    expect(executarFerramenta('abrir_calculadora', { preco: 100, categoria: 'saude', ano: 2025 }).texto).toContain('2026')
  })

  it('2026 avisa que é ano-teste', () => {
    const r = executarFerramenta('abrir_calculadora', { preco: 100, categoria: 'produto-padrao', ano: 2026 })
    expect(r.texto).toContain('ano-teste')
  })

  it('ferramenta desconhecida orienta o modelo a seguir sem ela', () => {
    expect(executarFerramenta('abrir_cesta', {}).texto).toContain('desconhecida')
  })
})
