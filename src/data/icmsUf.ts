/**
 * Alíquotas modais (internas, padrão) de ICMS por UF — valores de referência
 * de 2025, alguns já incorporando adicionais de fundos de combate à pobreza.
 * As alíquotas mudam por lei estadual; o campo é editável na interface.
 */

export interface IcmsUF {
  uf: string
  nome: string
  /** alíquota modal interna (fração) */
  aliquota: number
}

export const ICMS_UF: IcmsUF[] = [
  { uf: 'AC', nome: 'Acre', aliquota: 0.19 },
  { uf: 'AL', nome: 'Alagoas', aliquota: 0.2 },
  { uf: 'AM', nome: 'Amazonas', aliquota: 0.2 },
  { uf: 'AP', nome: 'Amapá', aliquota: 0.18 },
  { uf: 'BA', nome: 'Bahia', aliquota: 0.205 },
  { uf: 'CE', nome: 'Ceará', aliquota: 0.2 },
  { uf: 'DF', nome: 'Distrito Federal', aliquota: 0.2 },
  { uf: 'ES', nome: 'Espírito Santo', aliquota: 0.17 },
  { uf: 'GO', nome: 'Goiás', aliquota: 0.19 },
  { uf: 'MA', nome: 'Maranhão', aliquota: 0.23 },
  { uf: 'MG', nome: 'Minas Gerais', aliquota: 0.18 },
  { uf: 'MS', nome: 'Mato Grosso do Sul', aliquota: 0.17 },
  { uf: 'MT', nome: 'Mato Grosso', aliquota: 0.17 },
  { uf: 'PA', nome: 'Pará', aliquota: 0.19 },
  { uf: 'PB', nome: 'Paraíba', aliquota: 0.2 },
  { uf: 'PE', nome: 'Pernambuco', aliquota: 0.205 },
  { uf: 'PI', nome: 'Piauí', aliquota: 0.225 },
  { uf: 'PR', nome: 'Paraná', aliquota: 0.195 },
  { uf: 'RJ', nome: 'Rio de Janeiro', aliquota: 0.22 },
  { uf: 'RN', nome: 'Rio Grande do Norte', aliquota: 0.2 },
  { uf: 'RO', nome: 'Rondônia', aliquota: 0.195 },
  { uf: 'RR', nome: 'Roraima', aliquota: 0.2 },
  { uf: 'RS', nome: 'Rio Grande do Sul', aliquota: 0.17 },
  { uf: 'SC', nome: 'Santa Catarina', aliquota: 0.17 },
  { uf: 'SE', nome: 'Sergipe', aliquota: 0.2 },
  { uf: 'SP', nome: 'São Paulo', aliquota: 0.18 },
  { uf: 'TO', nome: 'Tocantins', aliquota: 0.2 },
]

export const UF_PADRAO = 'SP'

export const icmsDaUf = (uf: string): IcmsUF => ICMS_UF.find((x) => x.uf === uf) ?? ICMS_UF.find((x) => x.uf === UF_PADRAO)!
