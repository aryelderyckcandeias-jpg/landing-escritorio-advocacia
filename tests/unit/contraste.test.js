import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

// Lê as cores direto de tokens.css, assim o teste acompanha qualquer mudança de paleta.
const css = readFileSync(new URL('../../assets/css/tokens.css', import.meta.url), 'utf8');
const cor = (nome) => {
  const achou = css.match(new RegExp(`--${nome}:\\s*(#[0-9a-fA-F]{6})`));
  assert.ok(achou, `token --${nome} não encontrado`);
  return achou[1];
};

function luminancia(hex) {
  const canais = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
  const [r, g, b] = canais.map((c) => (c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function contraste(a, b) {
  const [claro, escuro] = [luminancia(a), luminancia(b)].sort((x, y) => y - x);
  return (claro + 0.05) / (escuro + 0.05);
}

test('contraste: calculadora confere com valores conhecidos', () => {
  assert.equal(contraste('#000000', '#ffffff').toFixed(1), '21.0');
  assert.equal(contraste('#777777', '#ffffff').toFixed(2), '4.48');
});

const PARES_TEXTO = [
  ['papel', 'mogno', 'texto principal'],
  ['papel', 'bordo', 'texto sobre seções bordô'],
  ['papel-suave', 'mogno', 'texto secundário'],
  ['papel-suave', 'bordo', 'texto secundário sobre bordô'],
  ['tungstenio', 'mogno', 'destaques'],
  ['tungstenio', 'bordo', 'destaques sobre bordô'],
  ['mogno', 'papel', 'texto do botão'],
  ['papel', 'tarja', 'rodapé'],
  ['papel-suave', 'tarja', 'rodapé secundário'],
];

for (const [frente, fundo, uso] of PARES_TEXTO) {
  test(`contraste ≥ 4,5:1 — ${uso} (${frente} sobre ${fundo})`, () => {
    const razao = contraste(cor(frente), cor(fundo));
    assert.ok(razao >= 4.5, `${razao.toFixed(2)}:1`);
  });
}

test('contraste ≥ 4,5:1 — mensagens de erro sobre bordô e mogno', () => {
  const erro = '#ffb4a8';
  assert.ok(contraste(erro, cor('bordo')) >= 4.5);
  assert.ok(contraste(erro, cor('mogno')) >= 4.5);
});

test('contraste ≥ 3:1 — borda dos campos do formulário (componente de interface)', () => {
  assert.ok(contraste(cor('papel-suave'), cor('mogno')) >= 3);
});

// A luz do holofote clareia o fundo da primeira tela. No ponto mais claro (centro da luz),
// o texto ainda precisa de 4,5:1. Assim dá para ajustar --holofote-forca sem medo.
const numero = (nome) => {
  const achou = css.match(new RegExp(`--${nome}:\\s*([\\d.]+)`));
  assert.ok(achou, `token --${nome} não encontrado`);
  return Number(achou[1]);
};

function misturar(fundo, luz, opacidade) {
  const canal = (hex, i) => parseInt(hex.slice(i, i + 2), 16);
  return '#' + [1, 3, 5]
    .map((i) => Math.round(canal(fundo, i) + (canal(luz, i) - canal(fundo, i)) * opacidade).toString(16).padStart(2, '0'))
    .join('');
}

test('contraste ≥ 4,5:1 — texto da primeira tela no centro da luz do holofote', () => {
  const forca = numero('holofote-forca');
  assert.ok(forca > 0 && forca <= 1, `--holofote-forca deve ficar entre 0 e 1 (veio ${forca})`);
  const fundoIluminado = misturar(cor('mogno'), cor('tungstenio'), forca);
  for (const texto of ['papel', 'papel-suave']) {
    const razao = contraste(cor(texto), fundoIluminado);
    assert.ok(razao >= 4.5, `${texto} sobre a luz (força ${forca}): ${razao.toFixed(2)}:1`);
  }
});
