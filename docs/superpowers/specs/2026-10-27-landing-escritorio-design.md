# Landing page de escritório de advocacia criminal: especificação de design

Data: 2026-10-27

## 1. Objetivo

Criar a landing page de um escritório de advocacia criminal **fictício** de padrão boutique, para mostrar a clientes e recrutadores domínio de front-end moderno: efeitos visuais bem executados, acessibilidade, segurança, LGPD e testes automatizados.

Sucesso significa:

- A página causa boa primeira impressão e passa a ideia de **discrição e sigilo**, que é o valor central de quem contrata defesa criminal.
- Funciona bem em celular e desktop, com teclado e leitor de tela.
- É entregue com testes automatizados, CI verde e publicação gratuita no GitHub Pages.
- O responsável pelo projeto aprende o que foi construído, porque escreve parte do código.

Fora do escopo: backend, CMS, versão em outro idioma, analytics, blog, formulário que envia dados de verdade.

## 2. Conceito

A página é um **processo em segredo de justiça aberto sob uma lâmpada de mesa**.

- **Efeito principal (A): tarjas.** Títulos selecionados começam cobertos por tarjas, como num documento sigiloso. As tarjas se abrem uma única vez, quando o título entra na tela.
- **Toque de holofote (B): só na primeira tela.** Uma luz quente segue o cursor sobre o fundo escuro. Em telas de toque, a luz percorre a tela sozinha.
- **Regra de contenção:** esses dois são os únicos efeitos de destaque. Menu, cartões e rodapé ficam sóbrios, sem animação de entrada em cada bloco.

O nome do escritório é provisório e fictício: *Vasconcelos Torres Advogados*. Pode ser trocado em um único lugar do HTML.

## 3. Sistema visual

### Paleta

| Token | Cor | Uso |
| --- | --- | --- |
| `--mogno` | `#1C1113` | Fundo principal |
| `--bordo` | `#4A1620` | Superfícies secundárias e rodapé |
| `--papel` | `#E8DFCC` | Texto |
| `--tungstenio` | `#F0D9A8` | Luz do holofote e detalhes mínimos |
| `--tarja` | `#070405` | Tarjas |

Não há cor de acento viva. O contraste do texto (`--papel` sobre `--mogno`) deve ser de pelo menos 4,5:1 (a meta é bem acima disso). A cor da tarja é validada olhando a página renderizada, porque contra o `--mogno` o contraste é baixo e o efeito precisa continuar legível.

### Tipografia

- **Títulos:** Bodoni Moda, usada só em tamanhos grandes (traços finos somem em texto pequeno). Usamos o arquivo com tamanho óptico fixo (eixo `opsz` em 11): o arquivo com tamanho óptico automático deixa traços finos demais em títulos grandes (o "4" das etapas quase some em tela comum).
- **Título da primeira tela:** o tamanho acompanha a largura da coluna (`12cqi`), para ficar sempre em 3 linhas ("Defesa criminal / conduzida / com discrição."). Em celular deitado, também é limitado pela altura (`10svh`).
- **Texto:** Hanken Grotesk.
- Linhas de texto com menos de 75 caracteres e escala tipográfica definida em variáveis.
- As fontes são **hospedadas no próprio repositório** (arquivos `woff2` com as licenças), sem Google Fonts, para não enviar o IP do visitante a terceiros e melhorar o desempenho.

## 4. Estrutura da página

| Seção | Conteúdo |
| --- | --- |
| Cabeçalho | Marca, menu e botão "Contato sigiloso" |
| Primeira tela | Título com tarjas e holofote |
| Atuação | Inquérito e fase investigativa, crimes econômicos, Tribunal do Júri, habeas corpus e recursos, execução penal |
| Como atuamos | 4 etapas numeradas, porque é uma sequência real |
| Sócios | 2 perfis fictícios, com monograma em vez de foto |
| Perguntas | Perguntas frequentes com `details`/`summary` |
| Contato | Formulário de demonstração |
| Rodapé | Aviso de que o escritório e as pessoas são fictícios |
| `privacidade.html` | Política de privacidade em página separada |

Regras de conteúdo:

- Texto sóbrio e informativo, sem promessa de resultado, sem estatísticas inventadas e sem sensacionalismo, em linha com as regras de publicidade da advocacia (Provimento 205/2021 do CFOAB).
- Todo texto visível em português do Brasil.

## 5. Comportamento dos efeitos

### Tarjas

- Cada título marcado recebe uma camada de cobertura (`::after`) que se recolhe com `transform: scaleX()`. A cobertura é desenhada em faixas, uma por linha; o vão entre elas fica no topo de cada linha para a faixa cobrir acentos e descendentes (ç, g, q). Títulos tarjados usam altura de linha 1,15.
- Um `IntersectionObserver` adiciona a classe de abertura quando cerca de 40% do título está visível, e para de observar em seguida (acontece uma vez só).
- **Melhoria progressiva:** a cobertura só existe se a página marcar `html.js`. Sem JavaScript, o texto aparece normalmente.
- Com `prefers-reduced-motion: reduce`, não há tarja nem animação: o texto aparece direto.
- O texto está sempre no HTML e acessível a leitores de tela. A tarja é só uma camada visual.

### Holofote

- Um `radial-gradient` posicionado por variáveis CSS `--x` e `--y`, atualizadas em `pointermove` com `requestAnimationFrame`.
- Em `pointer: coarse` (toque), a luz percorre a tela sozinha por uma animação CSS, sem JavaScript.
- A animação pausa quando a primeira tela sai da vista e quando a aba fica oculta.
- Com movimento reduzido, a luz fica parada numa posição fixa.
- A luz **nunca esconde texto**: o texto mantém contraste total com ou sem o efeito.

## 6. Formulário de contato (demonstração)

- Campos: nome, e-mail ou telefone, assunto resumido e consentimento (caixa de seleção, não marcada por padrão).
- Validação no navegador, com mensagens de erro ligadas aos campos e anunciadas por `aria-live`.
- Um campo oculto anti-spam (honeypot).
- **Nada é enviado.** Ao confirmar, a página mostra uma mensagem informando que o formulário é de demonstração. O aviso fica visível junto ao formulário.
- Aviso permanente: "não envie detalhes do caso por aqui".
- O README explica como seria a versão real: backend próprio ou serviço de formulários, captcha, retenção mínima dos dados e base legal.
- Teste automatizado confirma que o envio **não faz nenhuma requisição de rede**.

## 7. Segurança e LGPD

- Nenhum recurso de terceiros: sem CDN, sem fontes externas, sem analytics, sem cookies. Por isso não há banner de cookies.
- `Content-Security-Policy` por `<meta>` (`default-src 'self'`). O GitHub Pages não permite cabeçalhos HTTP próprios, e isso é registrado como limitação conhecida no README.
- Links externos com `rel="noopener noreferrer"`.
- Política de privacidade em `privacidade.html`: quais dados o site trata (nenhum, na versão de demonstração), finalidade, direitos do titular e como a versão real trataria os dados.
- `<meta name="robots" content="noindex">`, para que um escritório fictício não seja indexado como se fosse real. Por causa disso a auditoria de SEO do Lighthouse não entra nas metas.
- Nunca colocar dados reais no repositório.

## 8. Acessibilidade

- HTML semântico (`header`, `nav`, `main`, `section`, `footer`), `lang="pt-BR"`, link "pular para o conteúdo".
- Foco visível em todos os elementos interativos e navegação completa por teclado.
- Formulário com `label` associado e erros textuais (não apenas cor).
- Conteúdo legível com zoom de 200% e sem rolagem horizontal em 320 px de largura.
- Tipografia fluida com máximo de no máximo 2,5 vezes o mínimo, para o zoom conseguir dobrar o texto (WCAG 1.4.4).
- Espaçamento de texto aumentado (WCAG 1.4.12) não corta nem tira conteúdo da tela.
- Alvos de toque com pelo menos 24 × 24 px (WCAG 2.5.8), exceto links dentro de frases.
- Cabeçalho em uma linha de 320 px em diante; menu a partir de 960 px.
- Respeita `prefers-reduced-motion`.

## 9. Arquitetura de arquivos

```text
.
├── index.html
├── privacidade.html
├── assets/
│   ├── css/        tokens.css, base.css, layout.css, components.css, effects.css
│   ├── js/         main.js, reveal.js, spotlight.js, form-validation.js
│   └── fonts/      arquivos woff2 e licenças
├── tests/
│   ├── unit/       form-validation.test.js (node:test, sem dependências)
│   └── e2e/        Playwright: tarjas, movimento reduzido, formulário, acessibilidade (axe)
├── docs/superpowers/specs/   esta especificação
├── .github/workflows/        ci.yml (testes) e pages.yml (publicação)
├── package.json              somente devDependencies
└── README.md
```

- **Caminhos relativos em todo o projeto** (sem `/` inicial), porque o GitHub Pages publica em `/landing-escritorio-advocacia/`.
- Cada arquivo CSS e JS tem uma responsabilidade só, descrita num comentário no topo.
- `form-validation.js` contém funções puras (sem acesso ao DOM), o que as torna fáceis de testar.

## 10. Testes e qualidade

| Camada | Ferramenta | O que verifica |
| --- | --- | --- |
| Unitário | `node --test` | Validação de nome, contato, assunto e consentimento; contraste das cores; proporção da tipografia fluida |
| E2E | Playwright (Chromium, Firefox e WebKit no CI) | Tarjas abrem ao rolar; sem JavaScript o texto aparece; movimento reduzido sem animação; holofote pausa fora da tela; formulário valida e não envia requisição de rede; primeira tela, cabeçalho, alvos de toque, espaçamento de texto e zoom |
| Acessibilidade | axe-core (via Playwright) | Nenhuma violação nas duas páginas |
| HTML e links | validador de HTML e verificador de links | Marcação válida e sem links quebrados |
| Desempenho | Lighthouse no CI | Desempenho, Acessibilidade e Boas práticas com nota de pelo menos 95 |

Também será feita verificação visual com capturas de tela em celular e desktop durante o desenvolvimento.

## 11. Publicação

- Workflow `pages.yml` publica no GitHub Pages **só se os testes passarem**.
- Passo único e manual do dono do repositório: *Settings → Pages → Source: GitHub Actions*.

## 12. Plano de aprendizado

O responsável escreve, com explicação e revisão:

1. `reveal.js` (as tarjas com `IntersectionObserver`).
2. `form-validation.js` e os testes unitários dele.

Eu escrevo o restante (HTML, CSS, variáveis, holofote, CI, textos) e explico cada decisão. Se o responsável preferir que eu escreva tudo, basta dizer.

## 13. Critérios de aceite

- [ ] Primeira tela com título tarjado e holofote funcionando em desktop e em celular.
- [ ] Sem JavaScript e com movimento reduzido, todo o texto é legível e nada fica coberto.
- [ ] Nenhuma requisição a domínios externos ao carregar a página.
- [ ] Todos os testes passam no CI e a página está publicada no GitHub Pages.
- [ ] axe sem violações; Lighthouse com nota de pelo menos 95 nas três categorias.
- [ ] README em português com como rodar, decisões e limitações.

## 14. Pontos em aberto

- Nome do escritório e dos sócios (provisórios e fictícios).
- Textos finais de cada seção (serão escritos na implementação seguindo as regras da seção 4).
