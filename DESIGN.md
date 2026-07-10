# Design

Instrumento fiscal de precisão. A mood-sentence: "manual técnico da Receita
redesenhado por um estúdio de dados — papel branco absoluto, verde-petróleo
mineral, numerais de extrato bancário".

## Estratégia de cor

**Committed** — o verde-petróleo profundo carrega a identidade (nav, hero,
painéis de destaque, ações primárias) sobre branco puro. O cobre-ferrugem é o
segundo papel e é *semântico*: sistema antigo em extinção. Nunca inverter.

## Tokens (OKLCH)

| Papel | Valor | Uso |
|---|---|---|
| `--bg` | `oklch(1 0 0)` | fundo da página (branco puro) |
| `--surface` | `oklch(0.972 0.006 210)` | painéis, cartões de dados |
| `--surface-2` | `oklch(0.945 0.01 210)` | faixas, hover |
| `--ink` | `oklch(0.21 0.02 220)` | texto corpo (≥ 7:1 no branco) |
| `--muted` | `oklch(0.45 0.02 220)` | texto secundário (≥ 4.5:1) |
| `--petrol` | `oklch(0.33 0.06 210)` | primário profundo: nav, hero, botões |
| `--petrol-deep` | `oklch(0.24 0.045 212)` | drench: fundos de painel escuro |
| `--petrol-bright` | `oklch(0.56 0.1 212)` | links, foco, seleção |
| `--copper` | `oklch(0.58 0.13 45)` | accent: sistema antigo, avisos de transição |
| `--line` | `oklch(0.89 0.01 210)` | hairlines, bordas |

## Paleta de dados (validada — dataviz script, ΔE 15.2)

| Série | Hex claro | Significado |
|---|---|---|
| CBS | `#0080a4` | novo · federal |
| IBS | `#3cb5cd` | novo · estados+municípios (rótulo direto obrigatório) |
| PIS/Cofins/IPI | `#943310` | antigo · federal |
| ICMS | `#c2622a` | antigo · estadual |
| ISS | `#e09257` | antigo · municipal (rótulo direto obrigatório) |
| IS | `#6a51b8` | novo · seletivo |

Regra fixa: família ferrugem = tributos extintos; família petróleo = IVA dual;
violeta = Imposto Seletivo. Texto nunca veste cor de série.

## Tipografia

- **Display** (`--font-display`): Archivo Black — h1, títulos de seção, marca.
- **UI/corpo** (`--font-ui`): Archivo Variable — todo o restante da interface.
- **Dados** (`--font-mono`): Spline Sans Mono Variable — valores, alíquotas,
  eixos, tabelas (`tabular-nums` só onde números se alinham em coluna).
- Escala rem fixa (registro product): 0.75 / 0.8125 / 0.875 / 1 / 1.125 /
  1.375 / 1.75 / 2.25 / 3 rem. Hero da Home pode usar clamp até 4.5rem.

## Componentes e marcas de gráfico

- Barras ≤ 24px, ponta de dado arredondada 4px, base reta; gaps de 2px na cor
  da superfície entre segmentos; linhas 2px; grid hairline sólido recessivo.
- Tooltip + crosshair por padrão; toda visualização essencial tem alternância
  "Tabela".
- Legenda sempre presente com ≥ 2 séries; rótulos diretos seletivos.

## Movimento

150–250ms, ease-out; entrada única por página (fade+rise 12px no conteúdo);
gráficos crescem no mount (scaleY/opacity). Tudo desligado sob
`prefers-reduced-motion`.
