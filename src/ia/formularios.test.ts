import { describe, expect, it } from 'vitest'
import { CESTA_PADRAO } from '../data/cesta'
import { simularCesta } from '../lib/cesta-mensal'
import {
  FORMULARIOS,
  MARCA_MOTOR,
  executarFormulario,
  falaVisivel,
  montarEntrada,
  valoresIniciais,
} from './formularios'

describe('especificações', () => {
  it('todo campo tem padrão e os ids batem com as props da ferramenta', () => {
    for (const spec of Object.values(FORMULARIOS)) {
      const entrada = montarEntrada(spec, valoresIniciais(spec))
      for (const campo of spec.campos) expect(entrada[campo.id], `${spec.id}.${campo.id}`).toBeDefined()
    }
  })

  it('cesta cobre as 8 categorias da página e manda um perfil de partida', () => {
    const spec = FORMULARIOS.cesta
    const entrada = montarEntrada(spec, valoresIniciais(spec))
    expect(entrada.perfil).toBe('familiar')
    expect(spec.campos.filter((c) => c.tipo === 'numero')).toHaveLength(CESTA_PADRAO.length)
  })

  it('ano vai como número (a ferramenta valida contra ANOS_SIMULAVEIS)', () => {
    const spec = FORMULARIOS.calculadora
    expect(montarEntrada(spec, { ...valoresIniciais(spec), ano: '2030' }).ano).toBe(2030)
  })
})

describe('executarFormulario', () => {
  it('os números vêm do motor, não do modelo', () => {
    const spec = FORMULARIOS.cesta
    const valores = valoresIniciais(spec)
    const envio = executarFormulario(spec, valores)

    const itens = CESTA_PADRAO.map((i) => ({ categoriaId: i.categoriaId, rotulo: i.rotulo, valor: i.valorPadrao }))
    const esperado = simularCesta(itens, 'SP', 2033)
    expect(envio.mensagem).toContain(Math.abs(esperado.deltaMensal).toFixed(2).replace('.', ','))
    expect(envio.url).toContain('#/cesta?')
    expect(envio.cartao?.ferramenta).toBe('Minha cesta')
  })

  it('a fala do visitante vai sem o bloco técnico; o modelo recebe os dois', () => {
    const envio = executarFormulario(FORMULARIOS.cashback, valoresIniciais(FORMULARIOS.cashback))
    expect(envio.mensagem).toContain(MARCA_MOTOR)
    expect(envio.fala).not.toContain(MARCA_MOTOR)
    expect(falaVisivel(envio.mensagem)).toBe(envio.fala)
  })

  it('cada formulário produz cartão e navegação com os padrões', () => {
    for (const spec of Object.values(FORMULARIOS)) {
      const envio = executarFormulario(spec, valoresIniciais(spec))
      expect(envio.cartao, spec.id).toBeDefined()
      expect(envio.url, spec.id).toBeDefined()
    }
  })

  it('cesta com valores editados chega à URL tal como digitado', () => {
    const spec = FORMULARIOS.cesta
    const envio = executarFormulario(spec, { ...valoresIniciais(spec), cesta_basica: 900, uf: 'MA' })
    expect(envio.url).toContain('cesta-basica=900')
    expect(envio.url).toContain('uf=MA')
  })
})

describe('falaVisivel', () => {
  it('texto sem marca atravessa intacto', () => {
    expect(falaVisivel('quanto custa um tênis?')).toBe('quanto custa um tênis?')
  })
})
