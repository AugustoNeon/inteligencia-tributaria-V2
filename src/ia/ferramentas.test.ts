import { describe, expect, it } from 'vitest'
import { comparar } from '../lib/engine'
import { CATEGORIAS } from '../data/categorias'
import { CESTA_PADRAO, PERFIS_CESTA } from '../data/cesta'
import { icmsDaUf } from '../data/icmsUf'
import { simularCesta } from '../lib/cesta-mensal'
import { simularPainel } from '../lib/painel'
import { compararCredito } from '../lib/regime'
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
    expect(executarFerramenta('abrir_tudo', {}).texto).toContain('desconhecida')
  })
})

describe('abrir_cesta', () => {
  it('perfil essencial: URL carrega as 8 categorias e os números vêm do motor', () => {
    const r = executarFerramenta('abrir_cesta', { perfil: 'essencial', ano: 2033, uf: 'SP' })
    expect(r.url).toContain('#/cesta?uf=SP&ano=2033')
    for (const item of CESTA_PADRAO) expect(r.url).toContain(`${item.categoriaId}=`)

    const perfil = PERFIS_CESTA.find((p) => p.id === 'essencial')!
    const itens = CESTA_PADRAO.map((i) => ({ categoriaId: i.categoriaId, rotulo: i.rotulo, valor: perfil.valores[i.categoriaId] ?? 0 }))
    const esperado = simularCesta(itens, 'SP', 2033)
    expect(r.texto).toContain(Math.abs(esperado.deltaMensal).toFixed(2).replace('.', ','))
  })

  it('valor por categoria sobrescreve o perfil', () => {
    const r = executarFerramenta('abrir_cesta', { perfil: 'familiar', ano: 2033, cesta_basica: 900 })
    expect(r.url).toContain('cesta-basica=900')
    expect(r.url).toContain('alimentos-gerais=450')
  })

  it('ano inválido vira erro corrigível', () => {
    expect(executarFerramenta('abrir_cesta', { perfil: 'familiar', ano: 2024 }).url).toBeUndefined()
  })
})

describe('abrir_cashback', () => {
  it('família elegível: devolução do motor e URL preenchida', () => {
    const r = executarFerramenta('abrir_cashback', { pessoas: 4, renda: 2800, cadunico: true })
    expect(r.texto).toContain('elegível')
    expect(r.texto).toContain('R$')
    expect(r.url).toContain('#/cashback?pe=4&renda=2800&cad=sim')
  })

  it('renda alta: não elegível, explica o limite', () => {
    const r = executarFerramenta('abrir_cashback', { pessoas: 2, renda: 10000, cadunico: true })
    expect(r.texto).toContain('NÃO é elegível')
    expect(r.texto).toContain('meio salário mínimo')
  })

  it('sem CadÚnico: não elegível pelo requisito', () => {
    const r = executarFerramenta('abrir_cashback', { pessoas: 4, renda: 1500, cadunico: false })
    expect(r.texto).toContain('CadÚnico')
    expect(r.url).toContain('cad=nao')
  })

  it('cadunico ausente: pede o dado em vez de assumir', () => {
    const r = executarFerramenta('abrir_cashback', { pessoas: 4, renda: 2800 })
    expect(r.url).toBeUndefined()
    expect(r.texto).toContain('cadunico')
  })
})

describe('abrir_regime', () => {
  it('receita baixa: nanoempreendedor entra na lista e fica FORA do IVA', () => {
    const r = executarFerramenta('abrir_regime', { receita: 30_000 })
    expect(r.texto).toContain('Nanoempreendedor')
    expect(r.cartao?.destaque.valor).toBe('Nanoempreendedor')
    expect(r.cartao?.destaque.rotulo).toContain('fora do IVA')
    expect(r.url).toContain('rec=30000')
  })

  it('acima do teto do Simples sobra só o regime regular', () => {
    const r = executarFerramenta('abrir_regime', { receita: 6_000_000 })
    expect(r.cartao?.destaque.valor).toBe('Regime regular')
    expect(r.texto).not.toContain('Nanoempreendedor')
  })

  it('atividade rural abre a opção de não contribuinte', () => {
    const semRural = executarFerramenta('abrir_regime', { receita: 1_000_000 })
    const comRural = executarFerramenta('abrir_regime', { receita: 1_000_000, rural: true })
    expect(semRural.texto).not.toContain('Produtor rural')
    expect(comRural.texto).toContain('Produtor rural')
    expect(comRural.url).toContain('rural=sim')
  })

  it('os números do crédito vêm do lib/regime, não de conta própria', () => {
    const categoria = CATEGORIAS.find((c) => c.id === 'produto-padrao')!
    const aliquota = comparar(1000, categoria, categoria.atual, 2033).aliquotaIvaEfetiva
    const esperado = compararCredito(1000, aliquota, 0.03)
    const r = executarFerramenta('abrir_regime', { receita: 120_000, categoria: 'produto-padrao', das: 3 })
    expect(r.texto).toContain(esperado.porFora.toFixed(2).replace('.', ','))
    expect(r.cartao?.linhas.some((l) => l.valor.includes(esperado.porDentro.toFixed(2).replace('.', ',')))).toBe(true)
  })

  it('receita ausente ou negativa vira erro corrigível, sem cartão', () => {
    for (const input of [{}, { receita: -1 }, { receita: 'muito' }]) {
      const r = executarFerramenta('abrir_regime', input)
      expect(r.url).toBeUndefined()
      expect(r.cartao).toBeUndefined()
      expect(r.texto).toContain('receita')
    }
  })
})

describe('cartão da simulação', () => {
  it('erro não gera cartão — o chat não mostra número que não existe', () => {
    expect(executarFerramenta('abrir_calculadora', { preco: -5, categoria: 'saude', ano: 2033 }).cartao).toBeUndefined()
    expect(executarFerramenta('abrir_cashback', { pessoas: 4, renda: 2800 }).cartao).toBeUndefined()
  })

  it('preço que cai marca ganho; preço que sobe marca perda', () => {
    const cai = executarFerramenta('abrir_calculadora', { preco: 100, categoria: 'cesta-basica', ano: 2033 })
    const sobe = executarFerramenta('abrir_calculadora', { preco: 100, categoria: 'servico-padrao', ano: 2033 })
    expect(cai.cartao?.destaque.tom).toBe('ganho')
    expect(sobe.cartao?.destaque.tom).toBe('perda')
  })

  it('o cartão leva a mesma URL do texto e repete os valores do motor', () => {
    const r = executarFerramenta('abrir_calculadora', { preco: 1000, categoria: 'produto-padrao', ano: 2033, uf: 'SP' })
    expect(r.cartao?.url).toBe(r.url)
    for (const linha of r.cartao!.linhas) expect(r.texto).toContain(linha.valor)
  })

  it('família sem CadÚnico: cartão diz que não há devolução', () => {
    const r = executarFerramenta('abrir_cashback', { pessoas: 4, renda: 1500, cadunico: false })
    expect(r.cartao?.destaque.valor).toBe('sem direito')
    expect(r.cartao?.linhas.some((l) => l.nota === 'sem CadÚnico')).toBe(true)
  })
})

describe('abrir_raio_x', () => {
  it('efeito líquido vem do simularPainel e consumo padrão é 80% da renda', () => {
    const r = executarFerramenta('abrir_raio_x', { pessoas: 4, renda: 2800, cadunico: true, uf: 'SP' })
    expect(r.url).toContain('cons=2240')
    const esperado = simularPainel({
      pessoas: 4,
      rendaFamiliar: 2800,
      inscritoCadUnico: true,
      consumo: 2240,
      uf: 'SP',
      salarioMinimo: 1621,
    })
    expect(r.texto).toContain(Math.abs(esperado.efeitoLiquidoMensal).toFixed(2).replace('.', ','))
  })

  it('cadunico ausente: erro corrigível', () => {
    expect(executarFerramenta('abrir_raio_x', { pessoas: 4, renda: 2800 }).url).toBeUndefined()
  })
})
