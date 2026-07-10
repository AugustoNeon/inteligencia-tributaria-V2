# Product

## Register

product

## Users

- **Cidadãos e consumidores brasileiros** que querem entender o que a Reforma Tributária (EC 132/2023 + LC 214/2025) muda no seu dia a dia: preços, cashback, cesta básica.
- **Contadores, analistas e empresários** que precisam simular a carga tributária de um produto ou serviço hoje versus no novo sistema (CBS/IBS/IS), ano a ano da transição.
- **Recrutadores e avaliadores técnicos** — o app é peça de portfólio de analista de dados/programador; precisa demonstrar domínio de dados, visualização e engenharia frontend.

## Product Purpose

"Inteligência Tributária" é um atlas interativo da Reforma Tributária do consumo: guia estruturado com fontes oficiais anexadas, linha do tempo 2023→2033 (e 2078), calculadora comparativa (sistema atual vs IVA dual), simulador de cashback para famílias do CadÚnico, painel de impacto por setor e glossário. Sucesso = o usuário sai entendendo *quanto* e *quando* algo muda, e consegue verificar cada afirmação na lei.

## Brand Personality

Precisa, institucional-moderna, transparente. Um instrumento fiscal de precisão — não um blog de notícias nem um site de banco. Números são protagonistas; cada estimativa declara suas premissas ("como calculamos") e aponta para o texto legal.

## Anti-references

- Verde-amarelo governamental genérico ou visual de portal gov.br.
- Dashboard dark-mode "fintech de IA" (navy + roxo + glassmorphism).
- Sites de notícias sobre reforma: paredes de texto, zero interatividade.
- SaaS-cream editorial com serifa italiana — não é uma revista.

## Design Principles

1. **Todo número tem fonte e premissa.** Estimativas exibem "como calculamos" e link para a lei; nada parece mais oficial do que é.
2. **A cor é semântica antes de estética.** Ferrugem/cobre = sistema antigo em extinção; petróleo/teal = sistema novo. Essa codificação atravessa todos os gráficos e não é violada.
3. **Mostrar, não explicar.** Preferir um gráfico interativo com tooltip a três parágrafos; preferir um simulador a uma tabela estática.
4. **Densidade com hierarquia.** Público misto (cidadão + contador): a resposta simples vem primeiro, o detalhe técnico expande sob demanda.
5. **Gráficos com gêmeo em tabela.** Toda visualização essencial tem vista de tabela acessível.

## Accessibility & Inclusion

- WCAG AA: texto corpo ≥ 4.5:1; paleta categórica validada para daltonismo (script dataviz).
- `prefers-reduced-motion` respeitado em todas as animações.
- Conteúdo 100% pt-BR; valores em BRL formatados com `Intl`.
- Identidade nas séries nunca por cor sozinha: legenda + rótulos diretos + tabela.
