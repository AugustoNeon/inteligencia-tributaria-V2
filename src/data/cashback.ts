/**
 * Regras do cashback (devolução personalizada) — EC 132/2023, art. 8º e LC 214/2025.
 * Percentuais MÍNIMOS nacionais; estados e municípios podem ampliar a devolução do IBS.
 */

export interface CategoriaEssencial {
  id: string
  rotulo: string
  /** fração da CBS devolvida */
  pctCBS: number
  /** fração do IBS devolvida (mínimo nacional) */
  pctIBS: number
  dica: string
}

export const ESSENCIAIS: CategoriaEssencial[] = [
  { id: 'energia', rotulo: 'Energia elétrica', pctCBS: 1, pctIBS: 0.2, dica: 'Conta de luz da residência' },
  { id: 'agua', rotulo: 'Água e esgoto', pctCBS: 1, pctIBS: 0.2, dica: 'Conta de água/saneamento' },
  { id: 'gas-encanado', rotulo: 'Gás natural encanado', pctCBS: 1, pctIBS: 0.2, dica: 'Gás canalizado residencial' },
  { id: 'botijao', rotulo: 'Botijão de gás (GLP até 13 kg)', pctCBS: 1, pctIBS: 0.2, dica: 'Gás de cozinha' },
  { id: 'telecom', rotulo: 'Telecomunicações', pctCBS: 1, pctIBS: 0.2, dica: 'Internet, telefone e celular' },
]

export const DEMAIS_CONSUMO = {
  rotulo: 'Demais compras tributadas',
  pctCBS: 0.2,
  pctIBS: 0.2,
  dica: 'Supermercado fora da cesta básica, vestuário, farmácia etc. — mínimo nacional de 20%',
}

export const REQUISITOS = [
  'Família inscrita no CadÚnico',
  'Renda familiar mensal por pessoa de até meio salário mínimo',
  'Residência no território nacional',
  'CPF regular do responsável',
]

export const CALENDARIO_CASHBACK = [
  { ano: 2027, evento: 'Começa a devolução da CBS' },
  { ano: 2029, evento: 'Começa a devolução do IBS, junto com a transição estadual/municipal' },
]

/** Valor editável na interface — salário mínimo usado no teste de elegibilidade. */
export const SALARIO_MINIMO_PADRAO = 1621

export const NOTAS_CASHBACK = [
  'A devolução é operacionalizada pelo CPF na nota; energia, água e gás podem ter o desconto aplicado direto na conta.',
  'Itens com alíquota zero (como a Cesta Básica Nacional) não geram cashback — não há imposto embutido a devolver.',
  'Estados e municípios podem ampliar os percentuais de devolução do IBS acima do mínimo nacional.',
]
