import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';

// WCAG 1.4.4 (texto ampliável até 200%) com tipografia fluida:
// clamp(mínimo, ...vw/cqi/svh..., máximo) acompanha a largura da janela, que encolhe com o zoom.
// O zoom do navegador vai até 500%; 5 x mínimo >= 2 x máximo garante que o texto consegue dobrar.
// Ou seja: máximo <= 2,5 x mínimo.
const pasta = new URL('../../assets/css/', import.meta.url);
const regras = [];
for (const arquivo of readdirSync(pasta).filter((n) => n.endsWith('.css'))) {
  const css = readFileSync(new URL(arquivo, pasta), 'utf8');
  for (const m of css.matchAll(/(font-size|--texto-\d+):\s*clamp\(\s*([\d.]+)rem\s*,(.*?),\s*([\d.]+)rem\s*\)/g)) {
    regras.push({ onde: `${arquivo}: ${m[1]}: clamp(${m[2]}rem, ${m[3].trim()}, ${m[4]}rem)`, min: Number(m[2]), max: Number(m[4]) });
  }
}

test('encontra as regras de tipografia fluida', () => {
  assert.ok(regras.length >= 3, `só ${regras.length} regras encontradas`);
});

for (const r of regras) {
  test(`zoom consegue dobrar o texto: ${r.onde}`, () => {
    assert.ok(r.max <= 2.5 * r.min, `máximo/mínimo = ${(r.max / r.min).toFixed(2)} (limite 2,5)`);
  });
}
