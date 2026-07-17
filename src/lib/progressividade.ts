/**
 * Curva de progressividade: a carga dos tributos de consumo como fração da
 * renda, por faixa de renda — hoje, no sistema pleno e depois do cashback.
 *
 * Escopo declarado: a curva olha os tributos da cesta de consumo (motor da
 * calculadora); as contas essenciais (luz, água, gás, telecom) entram apenas
 * pelo cashback, pois hoje seguem regimes próprios. Perfis ilustrativos em
 * data/progressividade.ts — não são microdados da POF.
 */

import { CESTA_PADRAO } from '../data/cesta'
import { SALARIO_MINIMO_PADRAO } from '../data/cashback'
import { FAIXAS_RENDA, type FaixaRenda } from '../data/progressividade'
import { calcularCashback } from './cashback'
import { simularCesta } from './cesta-mensal'

export interface PontoProgressividade {
  faixa: FaixaRenda
  /** tributos de consumo hoje, como fração da renda */
  cargaHoje: number
  /** no sistema pleno (2033), antes do cashback */
  cargaNova: number
  /** no sistema pleno, descontada a devolução */
  cargaComCashback: number
  cashbackMensal: number
  elegivel: boolean
}

export function curvaProgressividade(uf: string, salarioMinimo = SALARIO_MINIMO_PADRAO): PontoProgressividade[] {
  return FAIXAS_RENDA.map((faixa) => {
    const consumo = faixa.rendaFamiliar * faixa.fracaoConsumo
    const itens = CESTA_PADRAO.map((i) => ({
      categoriaId: i.categoriaId,
      rotulo: i.rotulo,
      valor: consumo * (faixa.pesos[i.categoriaId] ?? 0),
    }))
    const cesta = simularCesta(itens, uf, 2033)

    const cashback = calcularCashback({
      pessoas: faixa.pessoas,
      rendaFamiliar: faixa.rendaFamiliar,
      // premissa declarada: família elegível pela renda está inscrita no CadÚnico
      inscritoCadUnico: true,
      salarioMinimo,
      gastos: {
        energia: consumo * (faixa.pesos.energia ?? 0),
        agua: consumo * (faixa.pesos.agua ?? 0),
        botijao: consumo * (faixa.pesos.botijao ?? 0),
        telecom: consumo * (faixa.pesos.telecom ?? 0),
      },
      demaisCompras: consumo * ((faixa.pesos['produto-padrao'] ?? 0) + (faixa.pesos['servico-padrao'] ?? 0)),
    })

    const renda = faixa.rendaFamiliar
    return {
      faixa,
      cargaHoje: cesta.hoje.totalImpostos / renda,
      cargaNova: cesta.novo.totalImpostos / renda,
      cargaComCashback: (cesta.novo.totalImpostos - cashback.totalMensal) / renda,
      cashbackMensal: cashback.totalMensal,
      elegivel: cashback.elegivel,
    }
  })
}
