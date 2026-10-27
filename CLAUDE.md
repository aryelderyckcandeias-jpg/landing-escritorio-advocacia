# CLAUDE.md: landing page do escritório de advocacia (fictício)

Leia primeiro: `docs/superpowers/specs/2026-10-27-landing-escritorio-design.md` (o quê e por quê)
e o README (como rodar). Este arquivo diz **como trabalhar aqui**.

## Contexto da pessoa
Aryel é desenvolvedor iniciante e usa este projeto para **aprender** e montar portfólio
(freelance ou vaga júnior). Orçamento zero: só ferramentas gratuitas. Explique decisões em
português, de forma direta. Quando houver escolha de aprendizado, guie em vez de entregar pronto.

## Regras que não podem ser quebradas
- Todo texto visível em português do Brasil. Escritório e pessoas são **fictícios**; nunca
  colocar dados reais no repositório.
- **Nenhum recurso de terceiros** (CDN, Google Fonts, analytics, cookies). O CSP é
  `default-src 'self'`: sem `<script>` inline e sem atributos `style=""` (use classes).
- Caminhos **relativos** em todo o projeto (o Pages publica em `/landing-escritorio-advocacia/`).
- Efeitos: só tarjas (A) e holofote na primeira tela (B). Não adicionar outros.
- **A luz e a tarja nunca podem esconder texto** sem JavaScript, com `prefers-reduced-motion`
  ou se o script falhar (veja `marca-js.js`).
- Sem promessa de resultado nem estatísticas inventadas (Provimento 205/2021 do CFOAB).
- Formulário é demonstração: **nenhuma requisição de rede**.
- Nada de rótulos em CAIXA ALTA, setas "→" em links ou cartões de SaaS (guia visual do projeto).

## Comandos
- `npm run serve` (127.0.0.1:4173), `npm run test:unit`, `npm run test:e2e`, `npm run lint:html`.
- Os E2E usam `playwright` + `node:test` em arquivos `.cjs`; `axe.test.cjs` é pulado se
  `@axe-core/playwright` não estiver instalado.

## Arquitetura
Um arquivo, uma responsabilidade, com comentário no topo. `form-validation.js` é de funções
puras (sem DOM). `form.js` liga a validação à página. A luz do holofote usa as variáveis
`--lx` e `--ly` (registradas com `@property` em `tokens.css`).

## Como trabalhar
- Mudou comportamento? Escreva ou ajuste o teste **antes** (TDD) e veja falhar pelo motivo certo.
- Ao mexer em efeitos, **olhe a página** (capturas em 1440 px e 390 px) antes de dizer que ficou bom.
- Antes de afirmar que algo funciona, rode o comando e leia a saída.
- Commits pequenos, mensagem em português, no formato `tipo: o que mudou`.

## Plano de aprendizado (o que a pessoa escreve)
1. `assets/js/reveal.js` (tarjas com `IntersectionObserver`).
2. `assets/js/form-validation.js` e `tests/unit/form-validation.test.js`.
A v1 já existe, escrita por Claude. Para esses dois arquivos, **não entregue a solução**:
guie a pessoa a reescrevê-los passo a passo, usando os testes como rede de segurança.
