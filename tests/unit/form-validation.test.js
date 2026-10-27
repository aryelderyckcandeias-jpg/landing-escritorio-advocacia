import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  validateName,
  validateContact,
  validateSubject,
  validateConsent,
  isSpam,
  validateForm,
} from '../../assets/js/form-validation.js';

test('validateName: aceita nomes comuns, com acento, apóstrofo e hífen', () => {
  for (const nome of ['Ana Souza', 'José d\'Ávila', 'Maria-Clara', '  João  ', 'Zé']) {
    assert.equal(validateName(nome), null, nome);
  }
});

test('validateName: rejeita vazio, curto, longo, sem letra e tipos inválidos', () => {
  for (const nome of ['', '   ', 'A', '1234', '--', 'x'.repeat(81), null, undefined, 42, {}]) {
    assert.equal(typeof validateName(nome), 'string', String(nome));
  }
});

test('validateContact: aceita e-mail válido (maiúsculas e espaços ao redor)', () => {
  for (const c of ['ana@exemplo.com', '  ANA@Exemplo.COM ', 'a.b+c@sub.exemplo.com.br']) {
    assert.equal(validateContact(c), null, c);
  }
});

test('validateContact: aceita telefones brasileiros em formatos comuns', () => {
  for (const c of ['11987654321', '(11) 98765-4321', '+55 11 98765-4321', '1133334444', '(21) 3333-4444']) {
    assert.equal(validateContact(c), null, c);
  }
});

test('validateContact: rejeita e-mails e telefones inválidos', () => {
  for (const c of ['', 'ana', 'ana@', '@exemplo.com', 'ana@exemplo', 'ana @exemplo.com', '123', '119876543', '+55 11 9876-43210000', 'abc-defg-hijk', null, undefined, 5]) {
    assert.equal(typeof validateContact(c), 'string', String(c));
  }
});

test('validateSubject: exige entre 10 e 500 caracteres úteis', () => {
  assert.equal(validateSubject('Quero conversar sobre um inquérito.'), null);
  assert.equal(validateSubject('x'.repeat(500)), null);
  for (const s of ['', '         ', 'curto', 'x'.repeat(501), null, undefined, 10]) {
    assert.equal(typeof validateSubject(s), 'string', String(s));
  }
});

test('validateSubject: espaços nas pontas não contam para o mínimo', () => {
  assert.equal(typeof validateSubject('   curto     '), 'string');
});

test('validateConsent: só true é aceito', () => {
  assert.equal(validateConsent(true), null);
  for (const v of [false, 'true', 'on', 1, null, undefined]) {
    assert.equal(typeof validateConsent(v), 'string', String(v));
  }
});

test('isSpam: campo oculto preenchido indica robô', () => {
  assert.equal(isSpam({ website: '' }), false);
  assert.equal(isSpam({}), false);
  assert.equal(isSpam({ website: 'http://spam.example' }), true);
  assert.equal(isSpam(undefined), false);
});

test('validateForm: formulário correto é válido e não tem erros', () => {
  const r = validateForm({
    name: 'Ana Souza',
    contact: 'ana@exemplo.com',
    subject: 'Gostaria de uma conversa inicial.',
    consent: true,
  });
  assert.equal(r.valid, true);
  assert.deepEqual(r.errors, {});
});

test('validateForm: devolve erro por campo inválido, na ordem correta', () => {
  const r = validateForm({ name: '', contact: 'x', subject: 'oi', consent: false });
  assert.equal(r.valid, false);
  assert.deepEqual(Object.keys(r.errors), ['name', 'contact', 'subject', 'consent']);
  for (const msg of Object.values(r.errors)) assert.equal(typeof msg, 'string');
});

test('validateForm: robô é inválido mesmo com campos corretos, sem expor o motivo', () => {
  const r = validateForm({
    name: 'Ana Souza',
    contact: 'ana@exemplo.com',
    subject: 'Gostaria de uma conversa inicial.',
    consent: true,
    website: 'x',
  });
  assert.equal(r.valid, false);
  assert.deepEqual(r.errors, {});
});

test('validateForm: entrada ausente ou estranha não lança exceção', () => {
  for (const entrada of [undefined, null, {}, 'texto', 42]) {
    const r = validateForm(entrada);
    assert.equal(r.valid, false);
  }
});
