# Landing page do escritório: plano de implementação

> **Para executores:** use `superpowers:executing-plans` (ou `superpowers:subagent-driven-development`) e siga as tarefas na ordem. Os passos usam caixas de seleção (`- [ ]`).

**Objetivo:** construir a landing page estática do escritório de advocacia criminal fictício, com tarjas, holofote, formulário de demonstração, testes e publicação no GitHub Pages.

**Arquitetura:** HTML, CSS em camadas e JavaScript em módulos ES, sem etapa de build. A lógica de validação fica em funções puras, testáveis sem navegador. Os efeitos são melhorias progressivas: sem JavaScript ou com movimento reduzido, o conteúdo aparece completo.

**Tecnologias:** HTML5, CSS (variáveis, `@property`, `clip-path`/`transform`), JavaScript ES2022, `node:test`, Playwright, axe-core, html-validate, GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-10-27-landing-escritorio-design.md`

## Restrições globais

- Caminhos **relativos** em todo o projeto (sem `/` inicial). A página é publicada em `/landing-escritorio-advocacia/`.
- Nenhum recurso de terceiros: sem CDN, sem fontes externas, sem analytics, sem cookies.
- Paleta: `--mogno #1C1113`, `--bordo #4A1620`, `--papel #E8DFCC`, `--tungstenio #F0D9A8`, `--tarja #070405`.
- Fontes: Bodoni Moda (títulos, só em tamanho grande) e Hanken Grotesk (texto), hospedadas em `assets/fonts/`.
- Texto visível em português do Brasil; sem promessa de resultado, sem estatística inventada.
- `<meta name="robots" content="noindex">` e `lang="pt-BR"`.
- `Content-Security-Policy` por `<meta>` com `default-src 'self'`.
- Nenhum dado real no repositório. O formulário **não faz requisição de rede**.
- Respeitar `prefers-reduced-motion`. Contraste do texto de pelo menos 4,5:1.

## Pontos de atenção da revisão

Entradas e condições que a spec implica mas nenhuma tarefa de rotina testaria:

1. Nome com acento, apóstrofo e hífen (`D'Ávila-Souza`) deve ser aceito; só espaços ou só números deve ser recusado.
2. Telefone brasileiro em formatos variados (`(11) 91234-5678`, `+55 11 91234-5678`) e e-mail com maiúsculas e espaços nas pontas devem ser aceitos.
3. Texto gigante (10.000 caracteres), `null` e `undefined` não quebram a validação: são recusados com mensagem.
4. Sem JavaScript e com movimento reduzido, nenhum texto fica coberto por tarja.
5. A tarja abre uma vez só: rolar para cima e para baixo não a fecha de novo; um título já visível ao carregar também abre.
6. Em 320 px de largura não há rolagem horizontal.

---

## Estrutura de arquivos

| Arquivo | Responsabilidade |
| --- | --- |
| `package.json` | Scripts e devDependencies |
| `assets/css/tokens.css` | Variáveis: cores, escala tipográfica, espaçamentos, tempos |
| `assets/css/base.css` | `@font-face`, reset leve, tipografia e foco visível |
| `assets/css/layout.css` | Estrutura das seções e responsividade |
| `assets/css/components.css` | Cabeçalho, botões, cartões, perguntas, formulário, rodapé |
| `assets/css/effects.css` | Tarjas e holofote |
| `assets/js/form-validation.js` | Funções puras de validação |
| `assets/js/reveal.js` | Tarjas (`IntersectionObserver`) |
| `assets/js/spotlight.js` | Holofote da primeira tela |
| `assets/js/main.js` | Liga os módulos e o formulário |
| `index.html`, `privacidade.html` | Páginas |
| `tests/unit/form-validation.test.js` | Testes unitários |
| `tests/e2e/*.spec.js` | Playwright e axe |
| `.github/workflows/ci.yml`, `pages.yml` | Testes e publicação |

---

### Tarefa 1: Base do projeto (pacote, fontes, tokens)

**Arquivos:** criar `package.json`, `assets/fonts/*`, `assets/css/tokens.css`, `assets/css/base.css`, `.gitignore`, `.gitattributes`.

**Interfaces:**
- Produz: variáveis CSS `--mogno`, `--bordo`, `--papel`, `--tungstenio`, `--tarja`, `--fonte-titulo`, `--fonte-texto`, `--tempo-tarja` (900ms), escala `--texto-1` a `--texto-7`, `--espaco-1` a `--espaco-8`.

- [ ] **Passo 1:** criar `package.json` com scripts `test:unit` (`node --test tests/unit`), `test:e2e` (`playwright test`), `lint:html` (`html-validate index.html privacidade.html`), `serve` (`http-server -p 4173 -c-1`) e `test` (unit, depois e2e).
- [ ] **Passo 2:** instalar as fontes variáveis `@fontsource-variable/bodoni-moda` e `@fontsource-variable/hanken-grotesk`, copiar só os `woff2` do subconjunto latino para `assets/fonts/` junto com as licenças (OFL).
- [ ] **Passo 3:** escrever `tokens.css` e `base.css` (`@font-face` com `font-display: swap`, foco visível, `lang`-agnóstico).
- [ ] **Passo 4:** verificar com `ls assets/fonts` que os arquivos existem. Esperado: dois `woff2` e as licenças.
- [ ] **Passo 5:** commit `chore: base do projeto, fontes locais e tokens`.

### Tarefa 2: Validação do formulário (TDD)

**Arquivos:** criar `assets/js/form-validation.js`; testar em `tests/unit/form-validation.test.js`.

**Interfaces:**
- Produz (módulo ES, sem acesso ao DOM):
  - `validateName(value: unknown): string | null`: 2 a 80 caracteres após `trim`, ao menos uma letra, aceita acentos, apóstrofo e hífen.
  - `validateContact(value: unknown): string | null`: e-mail válido (ignora maiúsculas e espaços nas pontas) **ou** telefone brasileiro com 10 ou 11 dígitos, aceitando `+55`, parênteses, espaços e hífen.
  - `validateSubject(value: unknown): string | null`: 10 a 500 caracteres após `trim`.
  - `validateConsent(value: unknown): string | null`: só `true` é aceito.
  - `isSpam(data: { website?: unknown }): boolean`: `true` se o campo oculto `website` tiver conteúdo.
  - `validateForm(data: { name, contact, subject, consent, website? }): { valid: boolean, errors: Record<string, string> }`.
  - Cada função devolve `null` quando válido e uma mensagem em português quando inválido.

- [ ] **Passo 1:** escrever os testes: `validateName("D'Ávila-Souza")` é `null`; `validateName("   ")`, `validateName("123")` e `validateName("A")` são strings; `validateContact("(11) 91234-5678")`, `validateContact("+55 11 91234-5678")`, `validateContact("  Ana@Exemplo.COM ")` são `null`; `validateContact("abc")` e `validateContact("1234")` são strings; `validateSubject("a".repeat(10001))`, `null` e `undefined` são strings (sem exceção); `validateConsent(false)` e `validateConsent("true")` são strings; `isSpam({ website: "x" })` é `true`; `validateForm` com tudo válido devolve `{ valid: true, errors: {} }` e, com nome vazio, devolve `errors.name`.
- [ ] **Passo 2:** `npm run test:unit`. Esperado: falha (módulo inexistente).
- [ ] **Passo 3:** implementar as funções acima em `form-validation.js` (e-mail com expressão simples e conservadora; telefone removendo tudo que não for dígito antes de contar).
- [ ] **Passo 4:** `npm run test:unit`. Esperado: todos passam.
- [ ] **Passo 5:** commit `feat: validação do formulário com testes unitários`.

### Tarefa 3: Páginas e CSS de layout

**Arquivos:** criar `index.html`, `privacidade.html`, `assets/css/layout.css`, `assets/css/components.css`.

**Interfaces:**
- Consome: tokens da Tarefa 1.
- Produz: marcação com `<h1 class="tarjado">`, títulos de seção `<h2 class="tarjado">`, `<section class="hero" data-holofote>`, `<form id="contato" novalidate>` com campos `name`, `contact`, `subject`, `consent`, `website` (oculto), e um `<p id="contato-status" role="status" aria-live="polite">`.

- [ ] **Passo 1:** escrever `index.html` com as seções da spec (cabeçalho, primeira tela, atuação, como atuamos, sócios, perguntas, contato, rodapé), `meta` de CSP, `noindex`, `viewport`, link "pular para o conteúdo" e textos em português seguindo as regras de conteúdo.
- [ ] **Passo 2:** escrever `privacidade.html` (dados tratados: nenhum na demonstração; finalidade; direitos do titular; como a versão real trataria os dados).
- [ ] **Passo 3:** escrever `layout.css` e `components.css` (mobile primeiro, sem rolagem horizontal em 320 px).
- [ ] **Passo 4:** `npm run lint:html`. Esperado: sem erros.
- [ ] **Passo 5:** commit `feat: páginas e estilos de layout`.

### Tarefa 4: Efeitos (tarjas e holofote)

**Arquivos:** criar `assets/js/reveal.js`, `assets/js/spotlight.js`, `assets/js/main.js`, `assets/css/effects.css`.

**Interfaces:**
- `initReveal(root?: ParentNode): void`: observa `.tarjado`, adiciona a classe `aberta` quando cerca de 40% do elemento está visível e para de observar em seguida. Não faz nada com movimento reduzido.
- `initSpotlight(hero: HTMLElement): void`: atualiza `--x` e `--y` em `pointermove` via `requestAnimationFrame`; em `pointer: coarse` não registra o evento (a animação CSS cuida); pausa fora da vista e com a aba oculta.
- `main.js`: adiciona `html.js` antes da renderização (por script curto no `<head>`), chama os dois inicializadores e liga o formulário a `validateForm`.

- [ ] **Passo 1:** escrever `effects.css`: cobertura `.js .tarjado::after` com `transform-origin: left`, `transition: transform var(--tempo-tarja)`; `.aberta::after { transform: scaleX(0) }`; holofote com `radial-gradient` posicionado por `--x`/`--y`; animação com `@property` para o toque; bloco `@media (prefers-reduced-motion: reduce)` que remove cobertura e animação.
- [ ] **Passo 2:** implementar `initReveal`, `initSpotlight` e `main.js`, incluindo o comportamento do formulário (mostra erros ligados aos campos, anuncia em `aria-live`, e na confirmação mostra o aviso de demonstração **sem** `fetch`).
- [ ] **Passo 3:** abrir pelo servidor local e conferir no navegador que as tarjas abrem ao rolar e que a luz segue o cursor.
- [ ] **Passo 4:** commit `feat: tarjas, holofote e formulário de demonstração`.

### Tarefa 5: Testes E2E e acessibilidade

**Arquivos:** criar `playwright.config.js`, `tests/e2e/efeitos.spec.js`, `tests/e2e/formulario.spec.js`, `tests/e2e/acessibilidade.spec.js`.

**Interfaces:** consome o servidor `npm run serve` (porta 4173) e os seletores da Tarefa 3.

- [ ] **Passo 1:** escrever `efeitos.spec.js`: com JavaScript desativado, nenhum `.tarjado` tem cobertura visível; com `reducedMotion: 'reduce'` também não; ao rolar até um `.tarjado` ele ganha `aberta` e, rolando de volta, continua com `aberta`; em 320 px de largura `document.documentElement.scrollWidth <= 320`.
- [ ] **Passo 2:** escrever `formulario.spec.js`: envio vazio mostra erros em `name`, `contact`, `subject` e `consent`; envio válido mostra o aviso de demonstração e **nenhuma requisição** além da página e dos assets locais é feita (`page.on('request')` não vê domínio externo nem método POST); preencher o campo oculto `website` não mostra confirmação.
- [ ] **Passo 3:** escrever `acessibilidade.spec.js`: `@axe-core/playwright` em `index.html` e `privacidade.html` sem violações.
- [ ] **Passo 4:** `npm run test:e2e`. Esperado: todos passam (se algum falhar por defeito da página, corrigir a página, não o teste).
- [ ] **Passo 5:** commit `test: E2E e acessibilidade`.

### Tarefa 6: CI, publicação e documentação

**Arquivos:** criar `.github/workflows/ci.yml`, `.github/workflows/pages.yml`, `README.md`, `CLAUDE.md`.

- [ ] **Passo 1:** `ci.yml`: em `push` e `pull_request`, roda `npm ci`, `lint:html`, `test:unit`, instala o Chromium do Playwright e roda `test:e2e`.
- [ ] **Passo 2:** `pages.yml`: em `push` na `main`, executa as mesmas verificações e só então publica o diretório raiz com `actions/upload-pages-artifact` e `actions/deploy-pages`.
- [ ] **Passo 3:** escrever o `README.md` em português (como rodar, decisões, limitações como CSP por `<meta>` e `noindex`, como seria a versão real do formulário) e o `CLAUDE.md` com o contexto para continuar o trabalho.
- [ ] **Passo 4:** conferir visualmente com capturas em 390 px e 1440 px e ajustar o que estiver feio ou ilegível.
- [ ] **Passo 5:** commit e `git push origin main`.

---

## Desvios em relação ao plano original (registrados na implementação)

O ambiente de construção da v1 não tinha acesso ao registro do npm (HTTP 403), então:

| Plano | O que foi feito | Consequência |
| --- | --- | --- |
| `http-server` como servidor | `scripts/serve.cjs`, servidor estático sem dependências | Nenhuma; também bloqueia arquivos ocultos (testado) |
| `@playwright/test` | `playwright` + `node:test` em arquivos `.cjs` | Mesmo navegador, menos dependências |
| Fontes instaladas e copiadas | `scripts/copiar-fontes.mjs` pronto, **não executado**; `fonts.css` é só um placeholder | **A tipografia real (Bodoni Moda e Hanken Grotesk) nunca foi vista**; rodar `npm run fonts` |
| axe, html-validate, Lighthouse | Escritos e configurados, **não executados** | `axe.test.cjs` é pulado sem o pacote; validar no CI |
| `npm ci` com lockfile | `npm install` no CI, com TODO | Gerar e commitar `package-lock.json`, depois trocar por `npm ci` |
| Efeito de tarja em bloco único | Faixas por linha (`repeating-linear-gradient` com `1lh`), recolhendo para a direita | Visual melhor; exige navegadores recentes (anotado no README) |
| Variáveis `--x`/`--y` | `--lx`/`--ly`, registradas com `@property` | Necessário para animar a luz no toque |
| Arquivos previstos | Acrescentados `marca-js.js` (marca `html.js` sem script inline, por causa do CSP) e `form.js` (liga a validação à página) | — |

Verificações extras feitas: teste de mutação (tarja que não abre, tarja que fecha de novo e
formulário que envia dados foram detectados pelos testes) e capturas de tela em 1440 px e 390 px.

### Finalização (depois da v1)

As pendências da tabela acima foram resolvidas:

- `package-lock.json` gerado e `npm ci` nos workflows.
- `npm run fonts` executado sem ajustes; fontes e licenças commitadas. O CI confere se batem
  com o pacote.
- axe, html-validate e Lighthouse executados. O html-validate tinha uma opção com nome errado
  (`allowMultiple` → `allowMultipleH1`) e pedia `DOCTYPE` em maiúsculas.
- Com as fontes reais e capturas em 18 tamanhos de tela, foram corrigidos: título em 5 linhas
  no desktop, cedilha e descendentes vazando da tarja, cabeçalho quebrando em 2 linhas,
  título enorme em celular deitado, caixa de consentimento pequena, conteúdo cortado com
  espaçamento de texto aumentado, título que não crescia com o zoom e holofote que voltava a
  andar fora da tela ao trocar de aba. Cada correção tem teste.
